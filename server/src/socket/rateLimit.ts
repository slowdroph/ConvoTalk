import type { Socket } from "socket.io";

const messageAttempts: Map<string, number[]> = new Map();
const MESSAGE_RATE_MAX = 20;
const MESSAGE_RATE_WINDOW_MS = 10_000;

const roomMessageAttempts: Map<string, Map<string, number[]>> = new Map();
const ROOM_RATE_MAX = 30;
const ROOM_RATE_WINDOW_MS = 60_000;

const ipEventAttempts: Map<string, Map<string, number[]>> = new Map();
const IP_EVENT_MAX: Record<string, number> = {
    message: 30,
    reply: 30,
    join: 40,
    pin_message: 20,
};
const IP_EVENT_WINDOW_MS = 10_000;

const typingThrottle: Map<string, number> = new Map();
const TYPING_THROTTLE_MS = 500;
const typingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
const TYPING_TIMEOUT_MS = 4000;

function isTrustedProxy(address: string): boolean {
    const host = String(address)
        .replace(/^\[|\]$/g, "")
        .split(":")[0];
    return (
        host === "::1" ||
        host === "::ffff:127.0.0.1" ||
        host === "127.0.0.1" ||
        /^10\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        /^192\.168\./.test(host)
    );
}

export function getClientIp(socket: Socket): string {
    const directAddress = socket.handshake.address || "unknown";
    const forwarded = socket.handshake.headers["x-forwarded-for"];
    if (forwarded && isTrustedProxy(directAddress)) {
        const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        const first = String(raw).split(",")[0];
        const trimmed = first.trim();
        if (trimmed) return trimmed;
    }
    return String(directAddress).trim() || "unknown";
}

export function isRateLimited(socketId: string): boolean {
    const now = Date.now();
    const timestamps = (messageAttempts.get(socketId) || []).filter(
        (t) => now - t < MESSAGE_RATE_WINDOW_MS,
    );
    if (timestamps.length >= MESSAGE_RATE_MAX) return true;
    timestamps.push(now);
    messageAttempts.set(socketId, timestamps);
    return false;
}

export function isIpEventRateLimited(ip: string, event: string): boolean {
    const max = IP_EVENT_MAX[event];
    if (!max) return false;
    const now = Date.now();
    let byEvent = ipEventAttempts.get(ip);
    if (!byEvent) {
        byEvent = new Map();
        ipEventAttempts.set(ip, byEvent);
    }
    const timestamps = (byEvent.get(event) || []).filter(
        (t) => now - t < IP_EVENT_WINDOW_MS,
    );
    if (timestamps.length >= max) return true;
    timestamps.push(now);
    byEvent.set(event, timestamps);
    return false;
}

export function isRoomRateLimited(roomId: string, socketId: string): boolean {
    const now = Date.now();
    let perRoom = roomMessageAttempts.get(roomId);
    if (!perRoom) {
        perRoom = new Map();
        roomMessageAttempts.set(roomId, perRoom);
    }
    const timestamps = (perRoom.get(socketId) || []).filter(
        (t) => now - t < ROOM_RATE_WINDOW_MS,
    );
    if (timestamps.length >= ROOM_RATE_MAX) return true;
    timestamps.push(now);
    perRoom.set(socketId, timestamps);
    return false;
}

function cleanupIpRateLimits(): void {
    const now = Date.now();
    for (const [ip, byEvent] of ipEventAttempts) {
        let empty = true;
        for (const [event, timestamps] of byEvent) {
            const filtered = timestamps.filter(
                (t) => now - t < IP_EVENT_WINDOW_MS,
            );
            if (filtered.length === 0) byEvent.delete(event);
            else {
                byEvent.set(event, filtered);
                empty = false;
            }
        }
        if (empty) ipEventAttempts.delete(ip);
    }
}

setInterval(cleanupIpRateLimits, 60_000).unref();

export function cleanupSocketRateLimits(socketId: string): void {
    messageAttempts.delete(socketId);
    for (const [roomId, perRoom] of roomMessageAttempts) {
        perRoom.delete(socketId);
        if (perRoom.size === 0) {
            roomMessageAttempts.delete(roomId);
        }
    }
    for (const key of Array.from(typingThrottle.keys())) {
        if (key.startsWith(`${socketId}:`)) {
            typingThrottle.delete(key);
        }
    }
}

export function isTypingThrottled(key: string): boolean {
    const now = Date.now();
    const last = typingThrottle.get(key) || 0;
    if (now - last < TYPING_THROTTLE_MS) return true;
    typingThrottle.set(key, now);
    return false;
}

export function clearTypingTimer(key: string): void {
    const timer = typingTimers.get(key);
    if (timer) clearTimeout(timer);
    typingTimers.delete(key);
}

export function clearTypingForUser(userId: string): void {
    for (const key of Array.from(typingTimers.keys())) {
        if (key.startsWith(`${userId}:`)) {
            clearTypingTimer(key);
        }
    }
}

export function scheduleTypingTimeout(
    socket: Socket,
    roomId: string,
    userId: string,
    name?: string,
    avatar?: string,
): void {
    const key = `${userId}:${roomId}`;
    clearTypingTimer(key);
    const timer = setTimeout(() => {
        typingTimers.delete(key);
        socket.to(roomId).emit("typing", {
            userId,
            name,
            avatar,
            isTyping: false,
        });
    }, TYPING_TIMEOUT_MS);
    typingTimers.set(key, timer);
}
