import { Server as SocketIOServer, Socket } from "socket.io";
import { randomUUID } from "crypto";
import Room from "../models/Room";
import {
    socketCallInitiateSchema,
    socketCallRespondSchema,
    socketCallEndSchema,
    socketWebRtcSignalSchema,
    safeParse,
} from "../validations/socket";

interface ActiveCall {
    callId: string;
    callerId: string;
    calleeId: string;
    roomId: string;
    callType: "audio" | "video";
}

const calls = new Map<string, ActiveCall>();

function isParticipant(
    room: { participants: unknown[] } | null,
    userId: string,
): boolean {
    if (!room) return false;
    return room.participants.some((p) => String(p) === userId);
}

function isInCall(userId: string): boolean {
    for (const call of calls.values()) {
        if (call.callerId === userId || call.calleeId === userId) return true;
    }
    return false;
}

function removeCall(callId: string): void {
    calls.delete(callId);
}

const webrtcHandler = (io: SocketIOServer): void => {
    io.on("connection", (socket: Socket) => {
        const userId = socket.userId!;

        socket.on(
            "call:initiate",
            async (
                data: {
                    roomId: string;
                    calleeId: string;
                    callType: "audio" | "video";
                },
                ack?: (res: { error?: string; callId?: string }) => void,
            ) => {
                try {
                    const parsed = safeParse(socketCallInitiateSchema, data);
                    if (!parsed.success) {
                        if (typeof ack === "function")
                            ack({ error: parsed.error });
                        return;
                    }
                    const { roomId, calleeId, callType } = parsed.data;

                    if (calleeId === userId) {
                        if (typeof ack === "function")
                            ack({ error: "Chamada inválida." });
                        return;
                    }
                    if (isInCall(userId)) {
                        if (typeof ack === "function")
                            ack({ error: "Você já está em uma chamada." });
                        return;
                    }

                    const room = await Room.findById(roomId)
                        .select("type participants")
                        .lean();
                    if (!room || room.type !== "direct") {
                        if (typeof ack === "function")
                            ack({ error: "Sala não encontrada." });
                        return;
                    }
                    if (
                        !isParticipant(room, userId) ||
                        !isParticipant(room, calleeId)
                    ) {
                        if (typeof ack === "function")
                            ack({ error: "Acesso negado." });
                        return;
                    }

                    const call: ActiveCall = {
                        callId: randomUUID(),
                        callerId: userId,
                        calleeId,
                        roomId,
                        callType,
                    };
                    calls.set(call.callId, call);

                    io.to(roomId).except(socket.id).emit("call:incoming", {
                        callId: call.callId,
                        roomId,
                        callerId: userId,
                        callType,
                    });

                    if (typeof ack === "function") ack({ callId: call.callId });
                } catch {
                    if (typeof ack === "function")
                        ack({ error: "Erro ao iniciar chamada." });
                }
            },
        );

        socket.on(
            "call:accept",
            async (
                data: { callId: string; calleeId: string },
                ack?: (res: { error?: string }) => void,
            ) => {
                try {
                    const parsed = safeParse(socketCallRespondSchema, data);
                    if (!parsed.success) {
                        if (typeof ack === "function")
                            ack({ error: parsed.error });
                        return;
                    }
                    const { callId, calleeId } = parsed.data;
                    const call = calls.get(callId);
                    if (
                        !call ||
                        call.calleeId !== calleeId ||
                        calleeId !== userId
                    ) {
                        if (typeof ack === "function")
                            ack({ error: "Chamada não encontrada." });
                        return;
                    }
                    io.to(call.roomId).except(socket.id).emit("call:accepted", {
                        callId,
                        calleeId,
                        callType: call.callType,
                        roomId: call.roomId,
                    });
                    if (typeof ack === "function") ack({});
                } catch {
                    if (typeof ack === "function")
                        ack({ error: "Erro ao aceitar chamada." });
                }
            },
        );

        socket.on(
            "call:reject",
            async (
                data: { callId: string; calleeId: string },
                ack?: (res: { error?: string }) => void,
            ) => {
                try {
                    const parsed = safeParse(socketCallRespondSchema, data);
                    if (!parsed.success) return;
                    const { callId, calleeId } = parsed.data;
                    const call = calls.get(callId);
                    if (!call) return;
                    if (call.calleeId !== calleeId || calleeId !== userId)
                        return;
                    removeCall(callId);
                    io.to(call.roomId).except(socket.id).emit("call:rejected", {
                        callId,
                        roomId: call.roomId,
                    });
                    if (typeof ack === "function") ack({});
                } catch {
                    // silencioso
                }
            },
        );

        socket.on(
            "call:end",
            async (
                data: { callId: string },
                ack?: (res: { error?: string }) => void,
            ) => {
                try {
                    const parsed = safeParse(socketCallEndSchema, data);
                    if (!parsed.success) return;
                    const { callId } = parsed.data;
                    const call = calls.get(callId);
                    if (!call) return;
                    if (call.callerId !== userId && call.calleeId !== userId)
                        return;
                    removeCall(callId);
                    io.to(call.roomId).emit("call:ended", {
                        callId,
                        roomId: call.roomId,
                    });
                    if (typeof ack === "function") ack({});
                } catch {
                    // silencioso
                }
            },
        );

        const handleSignal = (
            event: "webrtc:offer" | "webrtc:answer" | "webrtc:ice-candidate",
        ) => {
            socket.on(
                event,
                async (data: {
                    callId: string;
                    targetId: string;
                    payload: unknown;
                }) => {
                    try {
                        const parsed = safeParse(
                            socketWebRtcSignalSchema,
                            data,
                        );
                        if (!parsed.success) return;
                        const { callId, targetId, payload } = parsed.data;
                        const call = calls.get(callId);
                        if (!call) return;

                        const isCaller = call.callerId === userId;
                        const isCallee = call.calleeId === userId;
                        if (!isCaller && !isCallee) return;

                        const expectedTarget = isCaller
                            ? call.calleeId
                            : call.callerId;
                        if (targetId !== expectedTarget) return;

                        io.to(call.roomId)
                            .except(socket.id)
                            .emit(event, {
                                callId,
                                roomId: call.roomId,
                                from: userId,
                                payload,
                            });
                    } catch {
                        // silencioso
                    }
                },
            );
        };

        handleSignal("webrtc:offer");
        handleSignal("webrtc:answer");
        handleSignal("webrtc:ice-candidate");

        socket.on("disconnect", () => {
            for (const [callId, call] of Array.from(calls.entries())) {
                if (call.callerId === userId || call.calleeId === userId) {
                    removeCall(callId);
                    io.to(call.roomId).emit("call:ended", {
                        callId,
                        roomId: call.roomId,
                    });
                }
            }
        });
    });
};

export default webrtcHandler;
