import { Types } from "mongoose";
import Room from "../models/Room";

interface CachedRoom {
    participants: string[];
    type: "group" | "direct";
    expiresAt: number;
}

const ROOM_CACHE_TTL_MS = 30_000;
const ROOM_CACHE_MAX_ENTRIES = 1_000;

const roomCache = new Map<string, CachedRoom>();

function evictIfNeeded(): void {
    if (roomCache.size <= ROOM_CACHE_MAX_ENTRIES) return;
    const now = Date.now();
    for (const [key, entry] of roomCache) {
        if (entry.expiresAt <= now) {
            roomCache.delete(key);
        }
    }
    if (roomCache.size > ROOM_CACHE_MAX_ENTRIES) {
        const oldestKey = roomCache.keys().next().value;
        if (oldestKey !== undefined) {
            roomCache.delete(oldestKey);
        }
    }
}

export function invalidateRoom(roomId: string): void {
    roomCache.delete(roomId);
}

export async function getRoomInfo(
    roomId: string,
): Promise<CachedRoom | null> {
    const now = Date.now();
    const cached = roomCache.get(roomId);
    if (cached && cached.expiresAt > now) {
        return cached;
    }

    const room = await Room.findById(roomId)
        .select("participants type")
        .lean<{
            participants: (Types.ObjectId | string)[];
            type: "group" | "direct";
        }>();
    if (!room) return null;

    const entry: CachedRoom = {
        participants: room.participants.map((p) => p.toString()),
        type: room.type,
        expiresAt: now + ROOM_CACHE_TTL_MS,
    };
    roomCache.set(roomId, entry);
    evictIfNeeded();
    return entry;
}
