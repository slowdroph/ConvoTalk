import { Response } from "express";
import multer from "multer";
import Message from "../models/Message";
import Room from "../models/Room";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { objectId } from "../validations";
import {
    generateConversationPdf,
    createConversationPdfWriter,
} from "../services/export";
import cloudinary from "../config/cloudinary";
import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
    handleError,
    sendError,
} from "../utils/errors";
import { logger } from "../config/logger";
import { escapeRegex } from "../utils/regex";

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

        const escaped = escapeRegex(q);
        const messages = await Message.aggregate([
            {
                $lookup: {
                    from: "rooms",
                    localField: "room",
                    foreignField: "_id",
                    as: "room",
                },
            },
            { $unwind: "$room" },
            {
                $match: {
                    "room.participants": userId,
                    deleted: { $ne: true },
                    content: { $regex: escaped, $options: "i" },
                },
            },
            { $sort: { createdAt: -1, _id: -1 } },
            { $limit: Number(limit) || 20 },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    sender: 1,
                    type: 1,
                    room: {
                        _id: "$room._id",
                        name: "$room.name",
                        type: "$room.type",
                    },
                },
            },
        ]);

        const roomIds = [...new Set(messages.map((m) => m.room._id))];
        const users = await User.find({
            _id: { $in: messages.filter((m) => m.sender).map((m) => m.sender) },
        })
            .select("name avatar status")
            .lean();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const result = messages
            .filter((m) => m.sender == null || userMap.has(m.sender.toString()))
            .map((m) => ({
                ...m,
                sender: m.sender
                    ? (userMap.get(m.sender.toString()) ?? null)
                    : null,
                room: {
                    _id: m.room._id,
                    name: m.room.name,
                    type: m.room.type,
                },
            }))
            .sort((a, b) => {
                const aTime = new Date(a.createdAt).getTime();
                const bTime = new Date(b.createdAt).getTime();
                return bTime - aTime;
            });

        res.json({ messages: result, roomIds });
    } catch (error) {
        handleError(error, res, "Erro ao buscar mensagens.");
    }
}

export async function searchRoomMessages(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { roomId } = req.params;
        const { q, limit } = req.query as unknown as {
            q: string;
            limit: number;
        };

        const room = await Room.findById(roomId).select("participants").lean();
        if (!room) {
            throw new NotFoundError("Sala não encontrada.");
        }

        if (
            !room.participants.some(
                (p) => p.toString() === req.user!._id.toString(),
            )
        ) {
            throw new ForbiddenError("Acesso negado.");
        }

        const escaped = escapeRegex(q);
        const messages = await Message.find({
            room: roomId,
            deleted: { $ne: true },
            content: { $regex: escaped, $options: "i" },
        })
            .sort({ createdAt: -1 })
            .limit(limit ?? 20)
            .populate("sender", "name avatar status")
            .lean();

        const result = messages
            .filter((m) => m.sender != null)
            .sort((a, b) => {
                const aTime = new Date(a.createdAt).getTime();
                const bTime = new Date(b.createdAt).getTime();
                return aTime - bTime;
            });

        res.json({ messages: result });
    } catch (error) {
        handleError(error, res, "Erro ao buscar mensagens.");
    }
}

export async function exportRoom(
    req: AuthRequest,
    res: Response,
): Promise<void> {
    try {
        const { roomId } = req.params;
        const parsedRoomId = objectId.safeParse(roomId);
        if (!parsedRoomId.success) {
            throw new ValidationError("Sala inválida.");
        }

        const room = await Room.findById(parsedRoomId.data)
            .select("name type participants")
            .lean();
        if (!room) {
            throw new NotFoundError("Sala não encontrada.");
        }

        if (
            !room.participants.some(
                (p) => p.toString() === req.user!._id.toString(),
            )
        ) {
            throw new ForbiddenError("Acesso negado.");
        }

        const users = await User.find({ _id: { $in: room.participants } })
            .select("name")
            .lean();

        const roomTitle =
            room.type === "group" && room.name
                ? room.name
                : users
                      .map((u) => u.name)
                      .filter(Boolean)
                      .join(" e ") || "Conversa";

        const participantsLabel = `${users.length} participante${users.length === 1 ? "" : "s"}: ${users
            .map((u) => u.name)
            .join(", ")}`;

        const messageCount = await Message.countDocuments({
            room: parsedRoomId.data,
        });

        const safeTitle =
            roomTitle
                .replace(/[^\w\- ]+/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 40) || "conversa";
        const filename = `conversa-${safeTitle}-${new Date()
            .toISOString()
            .slice(0, 10)}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`,
        );

        const { doc, writeMessage, end } = createConversationPdfWriter({
            roomTitle,
            participantsLabel,
            messageCount,
            exportedAt: new Date(),
        });
        doc.pipe(res);

        const BATCH = 500;
        let lastId: string | null = null;
        for (;;) {
            const query: Record<string, unknown> = { room: parsedRoomId.data };
            if (lastId) query._id = { $gt: lastId };
            const messages = await Message.find(query)
                .sort({ _id: 1 })
                .limit(BATCH)
                .populate("sender", "name avatar status")
                .lean();

            if (messages.length === 0) break;

            for (const m of messages) {
                if (!m.sender) continue;
                writeMessage({
                    senderName: (m.sender as unknown as { name: string }).name,
                    content: m.content,
                    createdAt: m.createdAt,
                    deleted: m.deleted,
                });
            }
            lastId = (
                messages[messages.length - 1] as unknown as {
                    _id: { toString(): string };
                }
            )._id.toString();
        }
        end();
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
        const { roomId } = req.params;
        const parsedRoomId = objectId.safeParse(roomId);
        if (!parsedRoomId.success) {
            throw new ValidationError("Sala inválida.");
        }

        const room = await Room.findById(parsedRoomId.data)
            .select("participants")
            .lean();
        if (!room) {
            throw new NotFoundError("Sala não encontrada.");
        }

        if (
            !room.participants.some(
                (p) => p.toString() === req.user!._id.toString(),
            )
        ) {
            throw new ForbiddenError("Acesso negado.");
        }

        const files = req.files as Express.Multer.File[] | undefined;
        if (!files || files.length === 0) {
            throw new ValidationError("Nenhum arquivo enviado.");
        }

        const uploaded: {
            url: string;
            filename: string;
            mimetype: string;
            size: number;
            publicId: string;
        }[] = [];
        for (const file of files) {
            const b64 = Buffer.from(file.buffer).toString("base64");
            const dataURI = `data:${file.mimetype};base64,${b64}`;
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: "chat_app_attachments",
                resource_type: file.mimetype.startsWith("image/")
                    ? "image"
                    : "raw",
            });
            uploaded.push({
                url: result.secure_url,
                publicId: result.public_id,
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
            });
        }

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
        const { roomId, messageId } = req.params;
        const parsedRoomId = objectId.safeParse(roomId);
        const parsedMessageId = objectId.safeParse(messageId);
        if (!parsedRoomId.success || !parsedMessageId.success) {
            throw new ValidationError("Parâmetros inválidos.");
        }

        const room = await Room.findById(parsedRoomId.data)
            .select("participants")
            .lean();
        if (!room) {
            throw new NotFoundError("Sala não encontrada.");
        }

        if (
            !room.participants.some(
                (p) => p.toString() === req.user!._id.toString(),
            )
        ) {
            throw new ForbiddenError("Acesso negado.");
        }

        const parent = await Message.findOne({
            _id: parsedMessageId.data,
            room: parsedRoomId.data,
        }).lean();
        if (!parent) {
            throw new NotFoundError("Mensagem não encontrada.");
        }

        const replies = await Message.find({
            parentMessage: parsedMessageId.data,
            room: parsedRoomId.data,
            deleted: { $ne: true },
            deletedFor: { $ne: req.user!._id },
        })
            .sort({ createdAt: 1, _id: 1 })
            .populate("sender", "name avatar status")
            .populate({
                path: "parentMessage",
                select: "sender content attachments deleted",
                populate: { path: "sender", select: "name avatar status" },
            })
            .lean();

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
        const { roomId } = req.params;
        const { limit, before, beforeId } = req.query as unknown as {
            limit: number;
            before?: string;
            beforeId?: string;
        };

        const room = await Room.findById(roomId)
            .select("type participants")
            .lean();
        if (!room) {
            throw new NotFoundError("Sala não encontrada.");
        }

        if (
            !room.participants.some(
                (p) => p.toString() === req.user!._id.toString(),
            )
        ) {
            throw new ForbiddenError("Acesso negado.");
        }

        const query: Record<string, unknown> = {
            room: roomId,
            deletedFor: { $ne: req.user!._id },
        };
        if (before) {
            if (beforeId) {
                query.$or = [
                    { createdAt: { $lt: new Date(before) } },
                    { createdAt: new Date(before), _id: { $lt: beforeId } },
                ];
            } else {
                query.createdAt = { $lt: new Date(before) };
            }
        }

        const safeLimit = Number(limit) || 50;

        const messages = await Message.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .limit(safeLimit + 1)
            .populate("sender", "name avatar status")
            .populate({
                path: "parentMessage",
                select: "sender content attachments deleted",
                populate: { path: "sender", select: "name avatar status" },
            })
            .lean();

        const hasMore = messages.length > safeLimit;
        const result = messages.slice(0, safeLimit).reverse();

        res.json({ messages: result, hasMore });
    } catch (error) {
        handleError(error, res, "Erro ao buscar mensagens.");
    }
}
