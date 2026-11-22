import RoomList from "./RoomList";
import { useTranslation } from "react-i18next";
import UserSearchModal from "./UserSearchModal";
import CreateGroupModal from "./CreateGroupModal";
import Avatar from "../ui/Avatar";
import api from "../../services/api";
import { useEffect, useRef, useState } from "react";
import type { Room } from "../../types";

interface SearchResult {
    _id: string;
    content: string;
    createdAt: string;
    sender: { _id: string; name: string; avatar?: string } | null;
    room: { _id: string; name: string; type: "group" | "direct" };
}

interface SidebarProps {
    rooms: Room[];
    activeRoom: string | null;
    onSelectRoom: (roomId: string, messageId?: string) => void;
    onConversationCreated: (roomId: string) => void;
    onGroupCreated: (roomId: string) => void;
    onDeleteRoom: (roomId: string) => void;
    unreadCounts: Record<string, number>;
    mentionUnreadCounts: Record<string, number>;
    isOpen: boolean;
    onClose?: () => void;
}

export default function Sidebar({
    rooms,
    activeRoom,
    onSelectRoom,
    onConversationCreated,
    onGroupCreated,
    onDeleteRoom,
    unreadCounts,
    mentionUnreadCounts,
    isOpen,
    onClose,
}: SidebarProps) {
    const { t } = useTranslation("chat");
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [userSearchOpen, setUserSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = query.trim();

        debounceRef.current = setTimeout(async () => {
            if (!trimmed) {
                setResults([]);
                setSearchLoading(false);
                return;
            }

            setSearchLoading(true);
            try {
                const { data } = await api.get("/messages/search", {
                    params: { q: trimmed, limit: 20 },
                });
                setResults(data.messages as SearchResult[]);
            } catch {
                setResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const searching = query.trim().length > 0;

    const handleSelectResult = (roomId: string, messageId: string) => {
        setQuery("");
        setResults([]);
        onClose?.();
        onSelectRoom(roomId, messageId);
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[380px] max-w-[85vw] md:min-w-[340px] md:max-w-[420px] bg-noir-surface border-r border-noir-border flex flex-col h-full transition-transform duration-200 md:static md:translate-x-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-label={t("sidebar.aria")}
            >
                <div className="flex items-center justify-between gap-2 px-4 pt-3 md:hidden">
                    <span className="text-sm font-semibold text-slate-900 dark:text-noir-text-bright">
                        {t("sidebar.title")}
                    </span>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t("sidebar.closeAria")}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-noir-text-muted dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="p-3.5 space-y-3 border-b border-noir-border">
                    {/* Busca de mensagens */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-noir-text-muted">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("sidebar.searchPlaceholder")}
                            aria-label={t("sidebar.searchAria")}
                            className="w-full bg-slate-100 text-slate-700 placeholder-slate-400 rounded-xl pl-9 pr-14 py-2 border border-slate-200 focus:outline-none focus:border-emerald-600/60 focus:ring-1 focus:ring-emerald-600 transition text-sm dark:bg-noir-surface-alt dark:text-noir-text-bright dark:placeholder-noir-text-muted/70 dark:border-noir-border"
                        />
                        <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none gap-1.5">
                            {searchLoading && (
                                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                            )}
                            <kbd className="text-[10px] bg-slate-200 text-slate-500 border border-slate-300 px-1.5 py-0.5 rounded font-mono uppercase dark:bg-noir-border/60 dark:text-noir-text-muted dark:border-noir-border">
                                ⌘K
                            </kbd>
                        </span>
                    </div>
                    {/* Ações rápidas */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                            onClick={() => setGroupModalOpen(true)}
                            title={t("sidebar.createGroup")}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition dark:bg-noir-surface-alt dark:hover:bg-noir-border dark:text-noir-text-bright dark:border-noir-border/60"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span className="font-medium">{t("sidebar.createGroup")}</span>
                        </button>
                        <button
                            onClick={() => setUserSearchOpen(true)}
                            title={t("sidebar.newConversation")}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 border border-emerald-600/30 transition dark:text-emerald-400 dark:border-emerald-600/30"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <span className="font-medium">{t("sidebar.newConversation")}</span>
                        </button>
                    </div>
                </div>
                {searching ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
                        {!searchLoading && results.length === 0 && (
                            <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-noir-text-muted">
                                {t("sidebar.noSearchResults")}
                            </p>
                        )}
                        {results.map((result) => (
                            <button
                                key={result._id}
                                onClick={() =>
                                    handleSelectResult(
                                        result.room._id,
                                        result._id,
                                    )
                                }
                                className="w-full text-left px-3 py-3 border-b border-slate-200 hover:bg-slate-100 transition-colors flex items-start gap-3 dark:border-noir-border/50 dark:hover:bg-noir-surface-alt/60"
                            >
                                <Avatar
                                    src={result.sender?.avatar}
                                    name={result.sender?.name ?? t("sidebar.system")}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900 truncate dark:text-noir-text-bright">
                                            {result.sender?.name ??
                                                t("sidebar.systemMessage")}
                                        </span>
                                        <span className="text-xs text-slate-500 truncate shrink-0 dark:text-noir-text-muted">
                                            {result.room.name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 truncate dark:text-noir-text-muted">
                                        {result.content}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <RoomList
                        rooms={rooms}
                        activeRoom={activeRoom}
                        onSelectRoom={onSelectRoom}
                        onDeleteRoom={onDeleteRoom}
                        unreadCounts={unreadCounts}
                        mentionUnreadCounts={mentionUnreadCounts}
                    />
                )}

                {/* Footer */}
                <div className="p-3 border-t border-noir-border/70 flex items-center justify-between text-xs text-noir-text-muted bg-noir-surface">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px]">ConvoTalk</span>
                    </div>
                </div>

                <CreateGroupModal
                    isOpen={groupModalOpen}
                    onClose={() => setGroupModalOpen(false)}
                    onCreated={onGroupCreated}
                />
                <UserSearchModal
                    isOpen={userSearchOpen}
                    onClose={() => setUserSearchOpen(false)}
                    rooms={rooms}
                    onConversationCreated={(roomId) => {
                        setUserSearchOpen(false);
                        onConversationCreated(roomId);
                    }}
                    onGroupJoined={(roomId) => {
                        setUserSearchOpen(false);
                        onConversationCreated(roomId);
                    }}
                    onSelectRoom={(roomId) => {
                        setUserSearchOpen(false);
                        onClose?.();
                        onSelectRoom(roomId);
                    }}
                    onCreateGroup={() => setGroupModalOpen(true)}
                />
            </aside>
        </>
    );
}
