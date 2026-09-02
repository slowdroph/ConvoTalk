import { Response } from "express";
import Session from "../models/Session";
import { AuthRequest } from "../middleware/auth";
import { NotFoundError, handleError } from "../utils/errors";
import { getSocketIO } from "../config/io";
import { emitForceLogout } from "../utils/socket";

export async function getSessions(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const userId = req.user!._id;
        const currentSessionId = req.user!.sessionId;

        const sessions = await Session.find({ userId })
            .sort({ lastActiveAt: -1 })
            .select("-token")
            .lean();

        const sessionsWithCurrent = sessions.map((session) => ({
            ...session,
            _id: session._id.toString(),
            current: session._id.toString() === currentSessionId,
        }));

        res.json({ sessions: sessionsWithCurrent });
    } catch (error) {
        handleError(error, res);
    }
}

export async function deleteSession(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const userId = req.user!._id;
        const currentSessionId = req.user!.sessionId;
        const targetSessionId = req.params.sessionId as string;

        if (targetSessionId === currentSessionId) {
            res.status(400).json({
                success: false,
                error: {
                    code: "CANNOT_DELETE_CURRENT_SESSION",
                    message: "Não é possível excluir a sessão atual. Use o logout normal.",
                },
            });
            return;
        }

        const session = await Session.findOneAndDelete({
            _id: targetSessionId,
            userId,
        });

        if (!session) {
            throw new NotFoundError("Sessão não encontrada.");
        }

        const io = getSocketIO();
        if (io) {
            await emitForceLogout(io, userId, "remote_logout", targetSessionId);
        }

        res.json({ message: "Sessão encerrada com sucesso." });
    } catch (error) {
        handleError(error, res);
    }
}

export async function deleteAllSessions(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const userId = req.user!._id;
        const currentSessionId = req.user!.sessionId;

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

        res.json({ message: "Todas as outras sessões foram encerradas." });
    } catch (error) {
        handleError(error, res);
    }
}
