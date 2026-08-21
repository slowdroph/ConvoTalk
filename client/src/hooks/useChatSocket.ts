import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import type { Message } from "../types";
import type { TypingUser } from "../components/Chat/MessageList";

interface UseChatSocketOptions {
    socket: Socket | null;
    roomId: string;
    currentUserId: string | null;
}

export function useChatSocket({
    socket,
    roomId,
    currentUserId,
}: UseChatSocketOptions) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);

    useEffect(() => {
        if (!socket) return;

        socket.emit("join", roomId);

        const handleMessage = (msg: Message) => {
            if (msg.room !== roomId) return;
            setMessages((prev) => {
                if (msg.clientMessageId) {
                    const pendingIdx = prev.findIndex(
                        (m) => m.clientMessageId === msg.clientMessageId,
                    );
                    if (pendingIdx !== -1) {
                        const next = [...prev];
                        next[pendingIdx] = msg;
                        return next;
                    }
                }
                if (prev.some((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        };

        const handleTyping = (data: {
            userId: string;
            name: string;
            avatar?: string;
            isTyping: boolean;
        }) => {
            setTypingUsers((prev) => {
                const exists = prev.some((u) => u.userId === data.userId);
                if (data.isTyping && !exists) {
                    return [
                        ...prev,
                        {
                            userId: data.userId,
                            name: data.name,
                            avatar: data.avatar,
                        },
                    ];
                }
                if (!data.isTyping && exists) {
                    return prev.filter((u) => u.userId !== data.userId);
                }
                return prev;
            });
        };

        socket.on("message", handleMessage);
        socket.on("typing", handleTyping);

        const handleMessageDeleted = (messageId: string) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId ? { ...msg, deleted: true } : msg,
                ),
            );
        };

        socket.on("message_deleted", handleMessageDeleted);

        const handleMessageDeletedForMe = (data: {
            messageId: string;
            roomId: string;
            userId: string;
        }) => {
            if (data.roomId !== roomId || data.userId !== currentUserId)
                return;
            setMessages((prev) =>
                prev.filter((msg) => msg._id !== data.messageId),
            );
        };

        socket.on("message_deleted_for_me", handleMessageDeletedForMe);

        const handleMessageEdited = (data: {
            messageId: string;
            content: string;
            updatedAt?: string;
        }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === data.messageId
                        ? {
                              ...msg,
                              content: data.content,
                              edited: true,
                              updatedAt: data.updatedAt,
                          }
                        : msg,
                ),
            );
        };

        socket.on("message_edited", handleMessageEdited);

        const handleReactionUpdated = (data: {
            messageId: string;
            reactions: Record<string, string[]>;
        }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === data.messageId
                        ? { ...msg, reactions: data.reactions }
                        : msg,
                ),
            );
        };

        socket.on("reaction_updated", handleReactionUpdated);

        const handleMessagePinned = (data: {
            roomId: string;
            message: Message;
            pinnedBy: string;
        }) => {
            if (data.roomId !== roomId) return;
            setPinnedMessageIds((prev) =>
                prev.includes(data.message._id)
                    ? prev
                    : [...prev, data.message._id],
            );
        };

        const handleMessageUnpinned = (data: {
            roomId: string;
            messageId: string;
        }) => {
            if (data.roomId !== roomId) return;
            setPinnedMessageIds((prev) =>
                prev.filter((id) => id !== data.messageId),
            );
        };

        socket.on("message_pinned", handleMessagePinned);
        socket.on("message_unpinned", handleMessageUnpinned);

        return () => {
            socket.off("message", handleMessage);
            socket.off("typing", handleTyping);
            socket.off("message_deleted", handleMessageDeleted);
            socket.off("message_deleted_for_me", handleMessageDeletedForMe);
            socket.off("message_edited", handleMessageEdited);
            socket.off("reaction_updated", handleReactionUpdated);
            socket.off("message_pinned", handleMessagePinned);
            socket.off("message_unpinned", handleMessageUnpinned);
        };
    }, [socket, roomId, currentUserId]);

    useEffect(() => {
        if (!socket) return;

        const handleMessagesRead = (data: {
            messageIds: string[];
            userId: string;
        }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    data.messageIds.includes(msg._id)
                        ? {
                              ...msg,
                              readBy: Array.from(
                                  new Set([
                                      ...(msg.readBy || []),
                                      data.userId,
                                  ]),
                              ),
                          }
                        : msg,
                ),
            );
        };

        socket.on("messages_read", handleMessagesRead);

        return () => {
            socket.off("messages_read", handleMessagesRead);
        };
    }, [socket]);

    const addOptimisticMessage = useCallback((msg: Message) => {
        setMessages((prev) => [...prev, msg]);
    }, []);

    const markOptimisticFailed = useCallback((clientMessageId: string) => {
        setMessages((prev) =>
            prev.map((m) =>
                m.clientMessageId === clientMessageId
                    ? { ...m, status: "failed" as const }
                    : m,
            ),
        );
    }, []);

    return {
        messages,
        setMessages,
        typingUsers,
        setTypingUsers,
        pinnedMessageIds,
        setPinnedMessageIds,
        addOptimisticMessage,
        markOptimisticFailed,
    };
}