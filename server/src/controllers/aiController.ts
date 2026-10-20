import { Response } from "express";
import * as assistant from "../services/ai/assistant";
import { AuthRequest } from "../middleware/auth";
import { handleError } from "../utils/errors";

export async function summarizeRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const roomId = req.params.roomId as string;
        const { limit, sinceMessageId } = req.body as {
            limit?: number;
            sinceMessageId?: string;
        };

        const result = await assistant.summarizeRoom(roomId, req.user!._id, {
            limit,
            sinceMessageId,
        });
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao resumir a conversa.");
    }
}

export async function suggestReplies(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const roomId = req.params.roomId as string;
        const { messageId } = req.body as { messageId?: string };

        const result = await assistant.suggestReplies(
            roomId,
            req.user!._id,
            { messageId },
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao sugerir respostas.");
    }
}
