import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import type { Message } from "../types";
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

    const handleMessage = (msg: Message) => {
      if (!msg.sender || msg.sender._id === user._id) return;
      if (msg.type === "system") return;

      const isHidden = document.hidden;
      const isActiveRoom = msg.room === activeRoomIdRef.current;

      if (isActiveRoom && !isHidden) return;

      if (!isHidden) {
        showToast({
          title: msg.sender.name,
          message: msg.content.length > 100 ? msg.content.slice(0, 100) + "..." : msg.content,
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
        new Notification(msg.sender.name, {
          body: msg.content.length > 100 ? msg.content.slice(0, 100) + "..." : msg.content,
          icon: "/favicon.svg",
          tag: msg.room,
        });
      }

      if (!isActiveRoom) {
        unreadCount.current += 1;
        updateTitle();
      }
    };

    socket.on("message", handleMessage);

    const handleVisibility = () => {
      if (!document.hidden && unreadCount.current > 0) {
        unreadCount.current = 0;
        updateTitle();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    if (
      getBrowserNotificationsEnabled() &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }

    return () => {
      socket.off("message", handleMessage);
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
