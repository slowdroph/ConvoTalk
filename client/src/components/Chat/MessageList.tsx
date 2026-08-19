import { memo, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import MessageBubble from "./MessageBubble";
import Avatar from "../ui/Avatar";
import type { Message } from "../../types";

export interface TypingUser {
  userId: string;
  name: string;
  avatar?: string;
}

interface MessageListProps {
  messages: Message[];
  typingUsers: TypingUser[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  searchQuery?: string;
  highlightedMessageId?: string | null;
  roomType?: "group" | "direct";
  currentUserId?: string | null;
  onLoadMore: (container: HTMLDivElement | null) => void;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onOpenThread?: (message: Message) => void;
  pinnedMessageIds?: string[];
  onTogglePin?: (message: Message) => void;
}

const SCROLL_THRESHOLD = 150;
const TOP_THRESHOLD = 200;

function formatTypingMessage(users: TypingUser[]): string {
  if (users.length === 1) return `${users[0].name} está digitando...`;
  if (users.length === 2) return `${users[0].name} e ${users[1].name} estão digitando...`;
  return `${users[0].name} e ${users.length - 1} outras pessoas estão digitando...`;
}

function isNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
}

export default memo(function MessageList({
  messages,
  typingUsers,
  loading,
  loadingMore,
  hasMore,
  searchQuery,
  highlightedMessageId,
  roomType,
  currentUserId,
  onLoadMore,
  onDeleteMessage,
  onEditMessage,
  onToggleReaction,
  onReply,
  onOpenThread,
  pinnedMessageIds = [],
  onTogglePin,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const prevRowsCountRef = useRef(0);
  const lastAutoLoadRef = useRef(0);
  const [showNewBadge, setShowNewBadge] = useState(false);

  const loadMoreRows = hasMore ? 1 : 0;
  const typingRows = typingUsers.length > 0 ? 1 : 0;
  const rowCount = loadMoreRows + messages.length + typingRows;

  const getRowKey = (index: number) => {
    let i = index;
    if (hasMore) {
      if (i === 0) return "load-more";
      i -= 1;
    }
    if (i === messages.length) return "typing";
    return messages[i]?._id ?? `empty-${index}`;
  };

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 90,
    overscan: 8,
    getItemKey: getRowKey,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const near = isNearBottom(container);
      nearBottomRef.current = near;
      if (near) {
        setShowNewBadge(false);
      }
      if (
        hasMore &&
        !loadingMore &&
        container.scrollTop < TOP_THRESHOLD &&
        Date.now() - lastAutoLoadRef.current > 800
      ) {
        lastAutoLoadRef.current = Date.now();
        onLoadMore(container);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, onLoadMore]);

  useEffect(() => {
    if (loading) {
      virtualizer.scrollToIndex(rowCount - 1, { align: "end" });
    }
  }, [loading, virtualizer, rowCount]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      const container = containerRef.current;
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }
  }, [loading, messages.length]);

  useEffect(() => {
    const prevCount = prevRowsCountRef.current;
    const newCount = rowCount;
    prevRowsCountRef.current = newCount;

    if (loadingMore) return;

    if (newCount > prevCount) {
      if (nearBottomRef.current) {
        virtualizer.scrollToIndex(newCount - 1, {
          align: "end",
          behavior: "smooth",
        });
      } else {
        setShowNewBadge(true);
      }
    }
  }, [rowCount, loadingMore, virtualizer]);

  const scrollToBottom = () => {
    virtualizer.scrollToIndex(rowCount - 1, {
      align: "end",
      behavior: "smooth",
    });
    setShowNewBadge(false);
  };

  useEffect(() => {
    if (!highlightedMessageId) return;
    const index = messages.findIndex((m) => m._id === highlightedMessageId);
    if (index < 0) return;
    const rowIndex = hasMore ? index + 1 : index;
    virtualizer.scrollToIndex(rowIndex, { align: "center" });
  }, [highlightedMessageId, messages, hasMore, virtualizer]);

  const handleLoadMore = () => {
    onLoadMore(containerRef.current);
  };

  return (
    <div className="flex-1 relative">
      <div
        ref={containerRef}
        role="log"
        aria-live="polite"
        aria-label="Mensagens da conversa"
        className="absolute inset-0 overflow-y-auto overscroll-contain custom-scrollbar chat-bg-pattern px-4 py-2 pt-10"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin dark:border-green-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-zinc-500">
            <p>Nenhuma mensagem ainda. Comece a conversar!</p>
          </div>
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const index = virtualRow.index;
              return (
                <div
                  key={virtualRow.key}
                  ref={virtualizer.measureElement}
                  data-index={index}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {hasMore && index === 0 ? (
                    <div className="flex justify-center py-2">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-sm text-slate-500 hover:text-slate-700 disabled:text-slate-400 transition-colors dark:text-zinc-400 dark:hover:text-zinc-200 dark:disabled:text-zinc-600"
                      >
                        {loadingMore ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                            Carregando...
                          </span>
                        ) : (
                          "Carregar mensagens anteriores"
                        )}
                      </button>
                    </div>
                  ) : index === rowCount - 1 && typingUsers.length > 0 ? (
                    <div className="flex items-center gap-2 px-2 py-1">
                      <div className="flex items-center gap-2">
                        {typingUsers.slice(0, 3).map((u) => (
                          <Avatar key={u.userId} src={u.avatar} name={u.name} size="xs" />
                        ))}
                      </div>
                      <div className="flex items-center gap-1 px-3 py-2.5 bg-white border border-slate-200/80 rounded-full shadow-sm dark:bg-zinc-700 dark:border-transparent dark:shadow-black/20">
                        <span className="w-2 h-2 bg-slate-400 dark:bg-zinc-400 rounded-full" style={{ animation: "typingBounce 1.4s ease-in-out infinite", animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-slate-400 dark:bg-zinc-400 rounded-full" style={{ animation: "typingBounce 1.4s ease-in-out infinite", animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-slate-400 dark:bg-zinc-400 rounded-full" style={{ animation: "typingBounce 1.4s ease-in-out infinite", animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-zinc-500">
                        {formatTypingMessage(typingUsers)}
                      </span>
                    </div>
                  ) : (
                    (() => {
                      const messageIndex = hasMore ? index - 1 : index;
                      const msg = messages[messageIndex];
                      if (!msg) return null;
                      const isLast = messageIndex === messages.length - 1;
                      return (
                        <div
                          className={
                            isLast ? "animate-messageEnter" : undefined
                          }
                        >
                          <MessageBubble
                            key={msg._id}
                            message={msg}
                            onDelete={onDeleteMessage}
                            onEdit={onEditMessage}
                            onToggleReaction={onToggleReaction}
                            onReply={onReply}
                            onOpenThread={onOpenThread}
                            onTogglePin={onTogglePin}
                            isPinned={pinnedMessageIds.includes(msg._id)}
                            searchQuery={searchQuery}
                            highlighted={msg._id === highlightedMessageId}
                            roomType={roomType ?? "group"}
                            currentUserId={currentUserId ?? ""}
                          />
                        </div>
                      );
                    })()
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewBadge && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg transition-colors z-10 dark:bg-green-600 dark:hover:bg-green-700 dark:text-on-accent"
        >
          ↓ Novas mensagens
        </button>
      )}
    </div>
  );
});
