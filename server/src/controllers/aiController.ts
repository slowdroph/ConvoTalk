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
        const { limit, sinceMessageId, regenerate } = req.body as {
            limit?: number;
            sinceMessageId?: string;
            regenerate?: boolean;
        };

        const result = await assistant.summarizeRoom(roomId, req.user!._id, {
            limit,
            sinceMessageId,
            regenerate,
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
        const { messageId, regenerate } = req.body as {
            messageId?: string;
            regenerate?: boolean;
        };

        const result = await assistant.suggestReplies(
            roomId,
            req.user!._id,
            { messageId, regenerate },
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao sugerir respostas.");
    }
}
