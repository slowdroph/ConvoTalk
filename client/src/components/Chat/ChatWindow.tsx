import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { useWebRTC } from "../../hooks/useWebRTC";
import { useToast } from "../../contexts/ToastContext";
import { useChatSocket } from "../../hooks/useChatSocket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import MessageSearch from "./MessageSearch";
import ExportDialog from "./ExportDialog";
import GroupSettings from "./GroupSettings";
import CallModal from "./CallModal";
import ThreadPanel from "./ThreadPanel";
import PinnedMessagesDialog from "./PinnedMessagesDialog";
import ChatHeader from "./ChatHeader";
import api from "../../services/api";
import type { Message, Participant, Room } from "../../types";
import { getErrorMessage } from "../../utils/errors";

interface ChatWindowProps {
  roomId: string;
  roomName: string;
  roomDescription?: string;
  roomType: "group" | "direct";
  participants: Participant[];
  admins?: Participant[];
  avatar?: string;
  createdBy?: string | null;
  onRoomUpdated?: (room: Room) => void;
  onRoomDeleted?: (roomId: string) => void;
  onOpenSidebar?: () => void;
  highlightMessageId?: string | null;
}

export default function ChatWindow({
  roomId,
  roomName,
  roomDescription = "",
  roomType,
  participants,
  admins = [],
  avatar = "",
  createdBy = null,
  onRoomUpdated,
  onRoomDeleted,
  onOpenSidebar,
  highlightMessageId = null,
}: ChatWindowProps) {
  const { socket, onlineUsers, connected } = useSocket();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { messages, setMessages, typingUsers, pinnedMessageIds, setPinnedMessageIds } =
    useChatSocket({
      socket,
      roomId,
      currentUserId: user?._id ?? null,
    });
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(
    null,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [threadParent, setThreadParent] = useState<Message | null>(null);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(highlightMessageId ?? null);
  const [prevHighlightProp, setPrevHighlightProp] = useState<string | null>(
    highlightMessageId ?? null,
  );
  const wasConnected = useRef(false);
  const markReadTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadLatestMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/messages/${roomId}`);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id));
        const fresh = (data.messages as Message[]).filter(
          (m) => !existingIds.has(m._id),
        );
        return [...prev, ...fresh];
      });
      setHasMore(data.hasMore);
    } catch {
      // Falha silenciosa na reconciliação de mensagens
    }
  }, [roomId, setMessages]);

  useEffect(() => {
    if (connected && !wasConnected.current && messages.length > 0) {
      loadLatestMessages();
    }
    wasConnected.current = connected;
  }, [connected, messages.length, loadLatestMessages]);

  useEffect(() => {
    if (!socket || !user) return;

    const unread = messages.filter(
      (m) =>
        m.sender &&
        m.sender._id !== user._id &&
        !(m.readBy || []).includes(user._id),
    );
    if (unread.length === 0) return;

    if (markReadTimeoutRef.current) {
      clearTimeout(markReadTimeoutRef.current);
    }
    markReadTimeoutRef.current = setTimeout(() => {
      socket.emit("read_messages", {
        roomId,
        messageIds: unread.map((m) => m._id),
      });
    }, 800);

    return () => {
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
      }
    };
  }, [socket, messages, roomId, user]);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      setMessagesError(null);
      setMessagesLoading(true);
      try {
        const { data } = await api.get(`/messages/${roomId}`);
        if (!cancelled) {
          setMessages(data.messages);
          setHasMore(data.hasMore);
        }
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
        if (!cancelled) {
          setMessagesError("Erro ao carregar mensagens.");
        }
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [roomId, setMessages]);

  const displayName =
    roomType === "direct"
      ? participants.find((p) => p._id !== user?._id)?.name || "Usuário"
      : roomName;

  const otherUserId =
    roomType === "direct"
      ? participants.find((p) => p._id !== user?._id)?._id
      : undefined;

  const isOtherOnline = otherUserId
    ? onlineUsers.some((ou) => ou.userId === otherUserId)
    : false;

  const webrtc = useWebRTC({
    socket,
    roomId,
    currentUserId: user?._id ?? null,
    otherUserId,
    onNotify: (type, message) => showToast({ type, message }),
  });

  const otherUser = otherUserId
    ? participants.find((p) => p._id === otherUserId)
    : undefined;

  const onlineCount =
    roomType === "group"
      ? onlineUsers.filter((ou) =>
          participants.some((p) => p._id === ou.userId),
        ).length
      : 0;

  const otherStatus =
    roomType === "direct"
      ? onlineUsers.find((ou) => ou.userId === otherUserId)?.status ||
        otherUser?.status
      : undefined;

  useEffect(() => {
    let cancelled = false;

    if (!otherUserId) return;

    api
      .get(`/user/${otherUserId}/status`)
      .then(({ data }) => {
        if (!cancelled) {
          setOtherUserLastSeen(data.lastSeen ?? null);
        }
      })
      .catch(() => {
        // ignore
      });

    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  if (prevHighlightProp !== highlightMessageId) {
    setPrevHighlightProp(highlightMessageId);
    if (highlightMessageId) {
        setHighlightedMessageId(highlightMessageId);
    }
  }

  useEffect(() => {
    if (highlightMessageId) {
      window.history.replaceState(null, "", `#message-${highlightMessageId}`);
    }
  }, [highlightMessageId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setHighlightedMessageId(null);
      }
      if (e.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false);
          setHighlightedMessageId(null);
          return;
        }
        if (threadParent) {
          setThreadParent(null);
          return;
        }
        if (pinnedOpen) {
          setPinnedOpen(false);
          return;
        }
        if (replyingTo) {
          setReplyingTo(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, threadParent, pinnedOpen, replyingTo]);

  const handleDeleteMessage = useCallback(
    (messageId: string, forMe = false) => {
      if (socket) {
        socket.emit("delete_message", { messageId, roomId, forMe });
      }
    },
    [socket, roomId],
  );

  const handleEditMessage = useCallback(
    (messageId: string, content: string) => {
      if (socket) {
        socket.emit("edit_message", { messageId, roomId, content });
      }
    },
    [socket, roomId],
  );

  const handleToggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (socket) {
        socket.emit("toggle_reaction", { messageId, roomId, emoji });
      }
    },
    [socket, roomId],
  );

  const handleReply = useCallback((message: Message) => {
    setThreadParent(null);
    setReplyingTo(message);
  }, []);

  const handleOpenThread = useCallback((message: Message) => {
    setThreadParent(message);
    setReplyingTo(null);
  }, []);

  const handleTogglePin = useCallback(
    (message: Message) => {
      if (!socket) return;
      const isPinned = pinnedMessageIds.includes(message._id);
      setPinnedMessageIds((prev) =>
        isPinned ? prev.filter((id) => id !== message._id) : [...prev, message._id],
      );
      socket.emit(
        isPinned ? "unpin_message" : "pin_message",
        { roomId, messageId: message._id },
        (response: { error?: string }) => {
          if (response?.error) {
            setPinnedMessageIds((prev) =>
              isPinned ? [...prev, message._id] : prev.filter((id) => id !== message._id),
            );
            showToast({ type: "error", message: response.error });
          }
        },
      );
    },
    [socket, roomId, pinnedMessageIds, setPinnedMessageIds, showToast],
  );

  const handleUnpin = useCallback(
    (messageId: string) => {
      if (socket) {
        socket.emit("unpin_message", { roomId, messageId });
      }
    },
    [socket, roomId],
  );

  const handleToggleBlock = useCallback(async () => {
    if (!otherUserId) return;
    try {
      if (isBlocked) {
        await api.delete(`/user/${otherUserId}/block`);
        setIsBlocked(false);
        showToast({ type: "info", message: "Usuário desbloqueado." });
      } else {
        await api.post(`/user/${otherUserId}/block`);
        setIsBlocked(true);
        setMessages([]);
        showToast({ type: "info", message: "Usuário bloqueado." });
      }
    } catch (err) {
      showToast({
        type: "error",
        message: getErrorMessage(err, "Erro ao atualizar bloqueio."),
      });
    }
  }, [otherUserId, isBlocked, setMessages, showToast]);

  const handleLoadOlderMessages = useCallback(
    async (container: HTMLDivElement | null) => {
      if (!hasMore || loadingMore || messages.length === 0) return;

      setLoadingMore(true);
      const scrollHeightBefore = container?.scrollHeight || 0;

      try {
        const cursor = messages[0].createdAt;
        const { data } = await api.get(`/messages/${roomId}`, {
          params: { before: cursor, beforeId: messages[0]._id },
        });

        const newMessages = data.messages as Message[];
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const unique = newMessages.filter((m) => !existingIds.has(m._id));
          return [...unique, ...prev];
        });
        setHasMore(data.hasMore);

        if (container) {
          requestAnimationFrame(() => {
            const scrollHeightAfter = container.scrollHeight;
            container.scrollTop += scrollHeightAfter - scrollHeightBefore;
          });
        }
      } catch (error) {
        console.error("Erro ao carregar mensagens anteriores:", error);
      } finally {
        setLoadingMore(false);
      }
    },
    [hasMore, loadingMore, messages, roomId, setMessages],
  );

  const handleToggleSearch = () => {
    setSearchOpen((prev) => !prev);
    setHighlightedMessageId(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-full">
      <ChatHeader
        roomType={roomType}
        displayName={displayName}
        avatarUrl={roomType === "direct" ? otherUser?.avatar : avatar}
        avatarName={displayName}
        isOtherOnline={isOtherOnline}
        onlineCount={onlineCount}
        participantCount={participants.length}
        otherUserLastSeen={otherUserLastSeen}
        otherStatus={otherStatus}
        onOpenSidebar={onOpenSidebar}
        callDisabled={!isOtherOnline}
        onStartCall={webrtc.startCall}
        isBlocked={isBlocked}
        onToggleBlock={handleToggleBlock}
        searchOpen={searchOpen}
        onToggleSearch={handleToggleSearch}
        onOpenExport={() => setExportOpen(true)}
        onOpenPinned={() => setPinnedOpen(true)}
        onOpenGroupSettings={() => setGroupSettingsOpen(true)}
      />

      <GroupSettings
        isOpen={groupSettingsOpen}
        room={{
          _id: roomId,
          name: roomName,
          description: roomDescription,
          type: roomType,
          createdBy,
          participants,
          admins,
          avatar,
        }}
        onClose={() => setGroupSettingsOpen(false)}
        onRoomUpdated={(updatedRoom) => {
          onRoomUpdated?.(updatedRoom);
        }}
        onRoomDeleted={(id) => {
          onRoomDeleted?.(id);
          setGroupSettingsOpen(false);
        }}
      />

      <ExportDialog
        isOpen={exportOpen}
        roomId={roomId}
        roomName={displayName}
        onClose={() => setExportOpen(false)}
      />

      <PinnedMessagesDialog
        key={String(pinnedOpen)}
        isOpen={pinnedOpen}
        roomId={roomId}
        onClose={() => setPinnedOpen(false)}
        onOpenThread={(message) => {
          setThreadParent(message);
          setPinnedOpen(false);
        }}
        onUnpin={(messageId) => {
          handleUnpin(messageId);
          setPinnedMessageIds((prev) =>
            prev.filter((id) => id !== messageId),
          );
        }}
      />

      <CallModal
        phase={webrtc.phase}
        callType={webrtc.callType}
        remoteName={displayName}
        remoteAvatar={otherUser?.avatar}
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        muted={webrtc.muted}
        cameraOff={webrtc.cameraOff}
        isOtherOnline={isOtherOnline}
        onAccept={webrtc.acceptCall}
        onReject={webrtc.rejectCall}
        onEnd={webrtc.endCall}
        onToggleMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
      />

      {searchOpen && (
        <MessageSearch
          roomId={roomId}
          onHighlight={(messageId) => setHighlightedMessageId(messageId)}
          onQueryChange={setSearchQuery}
          onClose={() => {
            setSearchOpen(false);
            setHighlightedMessageId(null);
            setSearchQuery("");
          }}
        />
      )}

      <div className="flex-1 flex flex-col min-h-0">
        {messagesError && !messagesLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-red-400 text-sm">{messagesError}</p>
            <button
              onClick={() => {
                setMessagesError(null);
                setMessagesLoading(true);
                api.get(`/messages/${roomId}`).then(({ data }) => {
                  setMessages(data.messages);
                  setHasMore(data.hasMore);
                }).catch(() => {
                  setMessagesError("Erro ao carregar mensagens.");
                }).finally(() => {
                  setMessagesLoading(false);
                });
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm rounded-lg transition-colors dark:bg-zinc-800 dark:border-transparent dark:hover:bg-zinc-700 dark:text-white"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 md:flex-row">
            <div className="flex-1 flex flex-col min-h-0">
              <MessageList messages={messages} typingUsers={typingUsers} loading={messagesLoading} loadingMore={loadingMore} hasMore={hasMore} searchQuery={searchQuery} highlightedMessageId={highlightedMessageId} roomType={roomType} currentUserId={user?._id ?? null} onLoadMore={handleLoadOlderMessages} onDeleteMessage={handleDeleteMessage} onEditMessage={handleEditMessage} onToggleReaction={handleToggleReaction} onReply={handleReply} onOpenThread={handleOpenThread} pinnedMessageIds={pinnedMessageIds} onTogglePin={handleTogglePin} />
            </div>
            {threadParent && (
              <ThreadPanel
                roomId={roomId}
                roomType={roomType}
                parent={threadParent}
                onClose={() => setThreadParent(null)}
                onReply={handleReply}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={handleEditMessage}
                onToggleReaction={handleToggleReaction}
                onTogglePin={handleTogglePin}
                isPinned={(id) => pinnedMessageIds.includes(id)}
              />
            )}
          </div>
        )}
      </div>
      <MessageInput
        roomId={roomId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        isBlocked={isBlocked}
      />
    </div>
  );
}