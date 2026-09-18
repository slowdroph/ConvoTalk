import Message from "../models/Message";
import Room from "../models/Room";
import User from "../models/User";
import ReadLog from "../models/ReadLog";
import { IMessage } from "../types";
import {
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from "../utils/errors";
import { escapeRegex } from "../utils/regex";
import cloudinary from "../config/cloudinary";
import { logger } from "../config/logger";
import {
    generateConversationPdf,
    createConversationPdfWriter,
} from "./export";

export const POPULATE_SENDER = "sender name avatar status";

export const POPULATE_PARENT = {
    path: "parentMessage",
    select: "sender content attachments deleted",
    populate: { path: "sender", select: "name avatar status" },
};

export async function findMessageWithSenders(
    id: string,
): Promise<IMessage | null> {
    return Message.findById(id)
        .populate(POPULATE_SENDER)
        .populate(POPULATE_PARENT)
        .lean();
}

export async function searchMessagesGlobally(
    query: string,
    userId: string,
    limit?: number,
) {
    const escaped = escapeRegex(query);
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

    return { messages: result, roomIds };
}

export async function searchRoomMessages(
    roomId: string,
    query: string,
    filter: "all" | "mentions",
    limit: number,
    userId: string,
) {
    const room = await Room.findById(roomId).select("participants").lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (
        !room.participants.some(
            (p) => p.toString() === userId.toString(),
        )
    ) {
        throw new ForbiddenError("Acesso negado.");
    }

    let mongoQuery: Record<string, unknown> = {
        room: roomId,
        deleted: { $ne: true },
    };

    if (filter === "mentions") {
        mongoQuery.mentions = userId;
        if (query && query.trim()) {
            const escaped = escapeRegex(query);
            mongoQuery.content = { $regex: escaped, $options: "i" };
        }
    } else {
        if (!query || !query.trim()) {
            throw new ValidationError("Termo de busca é obrigatório.");
        }
        const escaped = escapeRegex(query);
        mongoQuery.content = { $regex: escaped, $options: "i" };
    }

    const messages = await Message.find(mongoQuery)
        .sort({ createdAt: -1 })
        .limit(limit ?? 20)
        .populate("sender", "name avatar status")
        .lean();

    return messages
        .filter((m) => m.sender != null)
        .sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return aTime - bTime;
        });
}

export async function getRoomMessages(
    roomId: string,
    userId: string,
    opts: { limit: number; before?: string; beforeId?: string },
) {
    const room = await Room.findById(roomId)
        .select("type participants")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (
        !room.participants.some(
            (p) => p.toString() === userId.toString(),
        )
    ) {
        throw new ForbiddenError("Acesso negado.");
    }

    const query: Record<string, unknown> = {
        room: roomId,
        deletedFor: { $ne: userId },
    };
    if (opts.before) {
        if (opts.beforeId) {
            query.$or = [
                { createdAt: { $lt: new Date(opts.before) } },
                { createdAt: new Date(opts.before), _id: { $lt: opts.beforeId } },
            ];
        } else {
            query.createdAt = { $lt: new Date(opts.before) };
        }
    }

    const safeLimit = Number(opts.limit) || 50;

    const messages = await Message.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(safeLimit + 1)
        .populate("sender", "name avatar status")
        .populate(POPULATE_PARENT)
        .lean();

    const hasMore = messages.length > safeLimit;
    const result = messages.slice(0, safeLimit).reverse();

    return { messages: result, hasMore };
}

export async function getThreadReplies(
    roomId: string,
    messageId: string,
    userId: string,
) {
    const room = await Room.findById(roomId)
        .select("participants")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    if (
        !room.participants.some(
            (p) => p.toString() === userId.toString(),
        )
    ) {
        throw new ForbiddenError("Acesso negado.");
    }

    const parent = await Message.findOne({
        _id: messageId,
        room: roomId,
    }).lean();
    if (!parent) {
        throw new NotFoundError("Mensagem não encontrada.");
    }

    const replies = await Message.find({
        parentMessage: messageId,
        room: roomId,
        deleted: { $ne: true },
        deletedFor: { $ne: userId },
    })
        .sort({ createdAt: 1, _id: 1 })
        .populate("sender", "name avatar status")
        .populate(POPULATE_PARENT)
        .lean();

    return replies;
}

export async function getMessageReadDetails(messageId: string, userId: string) {
    const message = await Message.findById(messageId).lean();
    if (!message) {
        throw new NotFoundError("Mensagem não encontrada.");
    }

    const room = await Room.findById(message.room)
        .select("participants")
        .lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    const isParticipant = room.participants.some(
        (p) => p.toString() === userId,
    );
    if (!isParticipant) {
        throw new ForbiddenError("Você não tem acesso a esta mensagem.");
    }

    const readLogs = await ReadLog.find({ messageId })
        .populate("userId", "name avatar")
        .sort({ readAt: -1 })
        .lean();

    return readLogs.map((log) => {
        const user = log.userId as unknown as { _id?: { toString(): string }; name?: string; avatar?: string };
        return {
            userId: user._id?.toString() || (log.userId as unknown as { toString(): string }).toString(),
            name: user.name || "Usuário",
            avatar: user.avatar || "",
            readAt: log.readAt.toISOString(),
            sessionId: log.sessionId.toString(),
        };
    });
}

export async function uploadAttachments(
    roomId: string,
    userId: string,
    files: Express.Multer.File[],
) {
    const parsedRoomId = (await import("../validations")).objectId.safeParse(roomId);
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
            (p) => p.toString() === userId.toString(),
        )
    ) {
        throw new ForbiddenError("Acesso negado.");
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

    return uploaded;
}

export async function exportRoomToPdf(
    roomId: string,
    userId: string,
    res: import("express").Response,
) {
    const parsedRoomId = (await import("../validations")).objectId.safeParse(roomId);
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
            (p) => p.toString() === userId.toString(),
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
}
