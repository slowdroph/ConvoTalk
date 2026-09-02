import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import type { Message, MentionNotificationPayload } from "../types";
import { playNotificationSound } from "../utils/sound";
import { useToast } from "../contexts/ToastContext";
import {
    getBrowserNotificationsEnabled,
    getSoundEnabled,
    getTitleBadgeEnabled,
} from "../utils/notificationPrefs";

const ORIGINAL_TITLE = "ConvoTalk";

export function useNotifications(
    socket: Socket | null,
    user: { _id: string; name: string } | null,
    activeRoomId: string | null,
) {
    const unreadCount = useRef(0);
    const activeRoomIdRef = useRef(activeRoomId);
    const { showToast } = useToast();

    useEffect(() => {
        activeRoomIdRef.current = activeRoomId;
    }, [activeRoomId]);

    const updateTitle = useCallback(() => {
        if (!getTitleBadgeEnabled()) {
            document.title = ORIGINAL_TITLE;
            return;
        }
        if (unreadCount.current > 0) {
            document.title = `(${unreadCount.current}) ${ORIGINAL_TITLE}`;
        } else {
            document.title = ORIGINAL_TITLE;
        }
    }, []);

    useEffect(() => {
        if (!socket || !user) return;

        const handleMessage = async (msg: Message) => {
            if (!msg.sender || msg.sender._id === user._id) return;
            if (msg.type === "system") return;

            const isHidden = document.hidden;
            const isActiveRoom = msg.room === activeRoomIdRef.current;

            if (isActiveRoom && !isHidden) return;

            if (!isHidden) {
                showToast({
                    title: msg.sender.name,
                    message:
                        msg.content.length > 100
                            ? msg.content.slice(0, 100) + "..."
                            : msg.content,
                });
            }

            if (getSoundEnabled()) {
                playNotificationSound();
            }

            if (
                isHidden &&
                getBrowserNotificationsEnabled() &&
                "Notification" in window &&
                Notification.permission === "granted"
            ) {
                // Se houver push subscription ativa, o service worker já exibe a
                // notificação nativa; evita notificações duplicadas.
                let hasPushSubscription = false;
                if ("serviceWorker" in navigator) {
                    try {
                        const registration =
                            await navigator.serviceWorker.ready;
                        hasPushSubscription = Boolean(
                            await registration.pushManager.getSubscription(),
                        );
                    } catch {
                        hasPushSubscription = false;
                    }
                }
                if (!hasPushSubscription) {
                    new Notification(msg.sender.name, {
                        body:
                            msg.content.length > 100
                                ? msg.content.slice(0, 100) + "..."
                                : msg.content,
                        icon: "/favicon.svg",
                        tag: msg.room,
                    });
                }
            }

            if (!isActiveRoom) {
                unreadCount.current += 1;
                updateTitle();
            }
        };

        const handleMention = async (payload: MentionNotificationPayload) => {
            if (payload.roomId === activeRoomIdRef.current) return;

            const isHidden = document.hidden;

            if (!isHidden) {
                showToast({
                    title: `@${payload.sender.name} mencionou você`,
                    message:
                        payload.content.length > 100
                            ? payload.content.slice(0, 100) + "..."
                            : payload.content,
                });
            }

            if (getSoundEnabled()) {
                playNotificationSound();
            }

            if (
                isHidden &&
                getBrowserNotificationsEnabled() &&
                "Notification" in window &&
                Notification.permission === "granted"
            ) {
                let hasPushSubscription = false;
                if ("serviceWorker" in navigator) {
                    try {
                        const registration =
                            await navigator.serviceWorker.ready;
                        hasPushSubscription = Boolean(
                            await registration.pushManager.getSubscription(),
                        );
                    } catch {
                        hasPushSubscription = false;
                    }
                }
                if (!hasPushSubscription) {
                    new Notification(`@${payload.sender.name} mencionou você`, {
                        body:
                            payload.content.length > 100
                                ? payload.content.slice(0, 100) + "..."
                                : payload.content,
                        icon: "/favicon.svg",
                        tag: `mention-${payload.roomId}`,
                    });
                }
            }
        };

        socket.on("message", handleMessage);
        socket.on("mention:new", handleMention);

        const handleVisibility = () => {
            if (!document.hidden && unreadCount.current > 0) {
                unreadCount.current = 0;
                updateTitle();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            socket.off("message", handleMessage);
            socket.off("mention:new", handleMention);
            document.removeEventListener("visibilitychange", handleVisibility);
            unreadCount.current = 0;
            updateTitle();
        };
    }, [socket, user, updateTitle, showToast]);

    useEffect(() => {
        unreadCount.current = 0;
        updateTitle();
    }, [activeRoomId, updateTitle]);
}
