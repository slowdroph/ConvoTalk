import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as sessionService from "../services/session";
import { NotFoundError, handleError } from "../utils/errors";

export async function getSessions(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const sessions = await sessionService.listUserSessions(
            req.user!._id,
            req.user!.sessionId ?? "",
        );
        res.json({ sessions });
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
        const currentSessionId = req.user!.sessionId ?? "";
        const targetSessionId = req.params.sessionId as string;

        const result = await sessionService.deleteUserSession(
            userId,
            targetSessionId,
            currentSessionId,
        );

        if (result.blocked) {
            res.status(400).json({
                success: false,
                error: {
                    code: "CANNOT_DELETE_CURRENT_SESSION",
                    message: "Não é possível excluir a sessão atual. Use o logout normal.",
                },
            });
            return;
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
        await sessionService.deleteAllOtherSessions(
            req.user!._id,
            req.user!.sessionId ?? "",
        );
        res.json({ message: "Todas as outras sessões foram encerradas." });
    } catch (error) {
        handleError(error, res);
    }
}
