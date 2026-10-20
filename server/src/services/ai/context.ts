import Room from "../../models/Room";
import Message from "../../models/Message";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import { getAiConfig } from "./config";

export interface ContextMessage {
    senderName: string;
    content: string;
    createdAt: Date;
}

export interface ConversationContext {
    messages: ContextMessage[];
    lastMessageId: string | null;
}

interface LeanMessage {
    _id: { toString(): string };
    content?: string | null;
    createdAt: Date;
    sender?: { name?: string } | null;
}

export async function assertRoomParticipant(
    roomId: string,
    userId: string,
): Promise<void> {
    const room = await Room.findById(roomId).select("participants").lean();
    if (!room) {
        throw new NotFoundError("Sala não encontrada.");
    }

    const isParticipant = room.participants.some(
        (p) => p.toString() === userId.toString(),
    );
    if (!isParticipant) {
        throw new ForbiddenError("Acesso negado.");
    }
}

export interface BuildContextOptions {
    limit?: number;
    sinceMessageId?: string;
}

export async function buildConversationContext(
    roomId: string,
    userId: string,
    options: BuildContextOptions = {},
): Promise<ConversationContext> {
    await assertRoomParticipant(roomId, userId);

    const config = getAiConfig();
    const requested = options.limit ?? config.maxContextMessages;
    const limit = Math.min(
        Math.max(requested, 1),
        config.maxContextMessages,
    );

    const query: Record<string, unknown> = {
        room: roomId,
        deleted: { $ne: true },
        deletedFor: { $ne: userId },
    };

    if (options.sinceMessageId) {
        const anchor = await Message.findOne({
            _id: options.sinceMessageId,
            room: roomId,
        })
            .select("createdAt")
            .lean<{ createdAt: Date }>();
        if (anchor) {
            query.createdAt = { $gte: anchor.createdAt };
        }
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .populate("sender", "name")
        .lean<LeanMessage[]>();

    const ordered = messages.slice().reverse();

    const contextMessages = ordered
        .map((m) => ({
            senderName: m.sender?.name || "Usuário",
            content: (m.content ?? "").trim(),
            createdAt: m.createdAt,
        }))
        .filter((m) => m.content.length > 0);

    return {
        messages: contextMessages,
        lastMessageId: ordered.length
            ? ordered[ordered.length - 1]._id.toString()
            : null,
    };
}

export async function buildMessageContext(
    roomId: string,
    userId: string,
    messageId: string,
): Promise<ConversationContext> {
    await assertRoomParticipant(roomId, userId);

    const anchor = await Message.findOne({ _id: messageId, room: roomId })
        .select("createdAt")
        .lean<{ createdAt: Date }>();
    if (!anchor) {
        throw new NotFoundError("Mensagem não encontrada.");
    }

    return buildConversationContext(roomId, userId, {
        sinceMessageId: messageId,
    });
}
