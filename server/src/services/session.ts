import Session from "../models/Session";
import { NotFoundError } from "../utils/errors";
import { getSocketIO } from "../config/io";
import { emitForceLogout } from "../utils/socket";

export async function listUserSessions(userId: string, currentSessionId: string) {
    const sessions = await Session.find({ userId })
        .sort({ lastActiveAt: -1 })
        .select("-token")
        .lean();

    return sessions.map((session) => ({
        ...session,
        _id: session._id.toString(),
        current: session._id.toString() === currentSessionId,
    }));
}

export async function deleteUserSession(
    userId: string,
    sessionId: string,
    currentSessionId: string,
) {
    if (sessionId === currentSessionId) {
        return { blocked: true };
    }

    const session = await Session.findOneAndDelete({
        _id: sessionId,
        userId,
    });

    if (!session) {
        throw new NotFoundError("Sessão não encontrada.");
    }

    const io = getSocketIO();
    if (io) {
        await emitForceLogout(io, userId, "remote_logout", sessionId);
    }

    return { blocked: false };
}

export async function deleteAllOtherSessions(userId: string, currentSessionId: string) {
    const otherSessions = await Session.find({
        userId,
        _id: { $ne: currentSessionId },
    })
        .select("_id")
        .lean();

    const sessionIds = otherSessions.map((s) => s._id.toString());

    const io = getSocketIO();
    if (io && sessionIds.length > 0) {
        for (const sessionId of sessionIds) {
            await emitForceLogout(io, userId, "all_devices", sessionId);
        }
    }

    await Session.deleteMany({
        userId,
        _id: { $ne: currentSessionId },
    });

    return sessionIds;
}
