import { Response } from "express";
import multer from "multer";
import * as messageService from "../services/message";
import { objectId } from "../validations";
import { AuthRequest } from "../middleware/auth";
import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
    handleError,
    sendError,
} from "../utils/errors";
import { logger } from "../config/logger";

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/json",
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/wav",
    "audio/mp4",
    "audio/x-m4a",
];

export const messageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ValidationError("Tipo de arquivo não permitido."));
        }
    },
});

export async function searchMessages(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { q, limit } = req.query as unknown as {
            q: string;
            limit?: number;
        };
        const userId = req.user!._id;

        if (typeof q !== "string" || q.trim().length === 0) {
            throw new ValidationError("Termo de busca é obrigatório.");
        }

        const result = await messageService.searchMessagesGlobally(q, userId, limit);
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar mensagens.");
    }
}

export async function searchRoomMessages(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const roomId = req.params.roomId as string;
        const { q, filter, limit } = req.query as unknown as {
            q: string;
            filter: "all" | "mentions";
            limit: number;
        };

        const messages = await messageService.searchRoomMessages(
            roomId,
            q,
            filter,
            limit,
            req.user!._id,
        );
        res.json({ messages });
    } catch (error) {
        handleError(error, res, "Erro ao buscar mensagens.");
    }
}

export async function exportRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const roomId = req.params.roomId as string;
        await messageService.exportRoomToPdf(roomId, req.user!._id, res);
    } catch (error) {
        if (!res.headersSent) {
            handleError(error, res, "Erro ao exportar a conversa.");
            return;
        }
        logger.error(
            { error },
            "Erro durante o streaming do PDF de exportação.",
        );
        if (!res.writableEnded) {
            res.destroy();
        }
    }
}

export async function uploadAttachments(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const roomId = req.params.roomId as string;
        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) {
            throw new ValidationError("Nenhum arquivo enviado.");
        }

        const uploaded = await messageService.uploadAttachments(
            roomId,
            req.user!._id,
            files,
        );
        res.status(201).json({ files: uploaded });
    } catch (error) {
        if (error instanceof multer.MulterError) {
            sendError(
                res,
                400,
                "VALIDATION_ERROR",
                "Arquivo muito grande (máximo 10MB).",
            );
            return;
        }
        handleError(error, res, "Erro ao enviar anexo.");
    }
}

export async function getThreadMessages(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const roomId = req.params.roomId as string;
        const messageId = req.params.messageId as string;
        const parsedRoomId = objectId.safeParse(roomId);
        const parsedMessageId = objectId.safeParse(messageId);
        if (!parsedRoomId.success || !parsedMessageId.success) {
            throw new ValidationError("Parâmetros inválidos.");
        }

        const replies = await messageService.getThreadReplies(
            parsedRoomId.data,
            parsedMessageId.data,
            req.user!._id,
        );
        res.json({ replies });
    } catch (error) {
        handleError(error, res, "Erro ao buscar respostas.");
    }
}

export async function getRoomMessages(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const roomId = req.params.roomId as string;
        const { limit, before, beforeId } = req.query as unknown as {
            limit: number;
            before?: string;
            beforeId?: string;
        };

        const result = await messageService.getRoomMessages(
            roomId,
            req.user!._id,
            { limit, before, beforeId },
        );
        res.json(result);
    } catch (error) {
        handleError(error, res, "Erro ao buscar mensagens.");
    }
}

export async function getMessageReadDetails(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const messageId = req.params.messageId as string;
        const userId = req.user!._id;

        const parsed = objectId.safeParse(messageId);
        if (!parsed.success) {
            sendError(res, 400, "INVALID_ID", "ID da mensagem inválido.");
            return;
        }

        const readDetails = await messageService.getMessageReadDetails(
            parsed.data,
            userId,
        );
        res.json({ readDetails });
    } catch (error) {
        handleError(error, res, "Erro ao buscar detalhes de leitura.");
    }
}
