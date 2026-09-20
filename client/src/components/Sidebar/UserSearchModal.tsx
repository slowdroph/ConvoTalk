import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSocket } from "../../hooks/useSocket";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";
import type { Room } from "../../types";

interface UserResult {
    _id: string;
    name: string;
    email: string;
    publicId: string;
    avatar?: string;
}

interface PublicGroup {
    _id: string;
    name: string;
    description: string;
    avatar: string;
    participantCount: number;
}

type Tab = "all" | "users" | "groups";

type Item =
    | { kind: "user"; user: UserResult }
    | { kind: "group"; room: Room };

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationCreated: (roomId: string) => void;
    onSelectRoom?: (roomId: string) => void;
    onCreateGroup?: () => void;
    onGroupJoined?: (roomId: string) => void;
    rooms?: Room[];
}

export default function UserSearchModal({
    isOpen,
    onClose,
    onConversationCreated,
    onSelectRoom,
    onCreateGroup,
    onGroupJoined,
    rooms = [],
}: UserSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [creatingId, setCreatingId] = useState<string | null>(null);
    const [publicGroups, setPublicGroups] = useState<PublicGroup[]>([]);
    const [publicLoading, setPublicLoading] = useState(false);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("all");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { onlineUsers } = useSocket();
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isOpen]);

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setQuery("");
            setResults([]);
            setError("");
            setTab("all");
            setSelectedIndex(0);
            setCreatingId(null);
            setPublicGroups([]);
            setJoiningId(null);
        }
    }

    const handleClose = useCallback(() => {
        setQuery("");
        setResults([]);
        setError("");
        setTab("all");
        setSelectedIndex(0);
        setCreatingId(null);
        setPublicGroups([]);
        setJoiningId(null);
        onClose();
    }, [onClose]);

    const search = useCallback(async (term: string) => {
        if (term.trim().length < 1) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const { data } = await api.get(
                `/users/search?q=${encodeURIComponent(term)}`,
            );
            setResults(Array.isArray(data) ? data : []);
            setSelectedIndex(0);
            setError("");
        } catch (err: unknown) {
            setResults([]);
            setError(getErrorMessage(err, "Erro ao buscar usuários"));
        } finally {
            setLoading(false);
        }
    }, []);

    const searchPublic = useCallback(async (term: string) => {
        setPublicLoading(true);
        try {
            const { data } = await api.get("/rooms/public", {
                params: { q: term.trim(), limit: 8 },
            });
            setPublicGroups(
                Array.isArray(data?.rooms) ? data.rooms : [],
            );
        } catch {
            setPublicGroups([]);
        } finally {
            setPublicLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            search(query);
            searchPublic(query);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, search, searchPublic]);

    const selectTab = (next: Tab) => {
        setTab(next);
        setSelectedIndex(0);
    };

    const isOnline = (userId: string) =>
        onlineUsers.some((u) => u.userId === userId);

    const groupResults = useMemo(() => {
        const term = query.trim().toLowerCase();
        const groups = rooms.filter((r) => r.type === "group");
        if (!term) return groups.slice(0, 5);
        return groups.filter((r) => r.name.toLowerCase().includes(term));
    }, [rooms, query]);

    const items: Item[] = useMemo(() => {
        const users: Item[] = results.map((user) => ({ kind: "user", user }));
        const groups: Item[] = groupResults.map((room) => ({
            kind: "group",
            room,
        }));
        if (tab === "users") return users;
        if (tab === "groups") return groups;
        return [...users, ...groups];
    }, [results, groupResults, tab]);

    const selectedIndexSafe = Math.min(
        selectedIndex,
        Math.max(items.length - 1, 0),
    );

    const handleStartConversation = async (userId: string) => {
        if (creatingId) return;
        setCreatingId(userId);
        setError("");
        try {
            const { data } = await api.post("/rooms/direct", { userId });
            onConversationCreated(data._id);
            handleClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao criar conversa"));
        } finally {
            setCreatingId(null);
        }
    };

    const handleSelectGroup = (roomId: string) => {
        handleClose();
        onSelectRoom?.(roomId);
    };

    const handleJoinPublic = async (roomId: string) => {
        if (joiningId) return;
        setJoiningId(roomId);
        setError("");
        try {
            const { data } = await api.post(`/rooms/${roomId}/join`);
            onGroupJoined?.(data._id);
            handleClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao entrar no grupo"));
        } finally {
            setJoiningId(null);
        }
    };

    const activateItem = (item: Item) => {
        if (item.kind === "user") handleStartConversation(item.user._id);
        else handleSelectGroup(item.room._id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            handleClose();
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) =>
                prev < items.length - 1 ? prev + 1 : prev,
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" && items.length > 0) {
            e.preventDefault();
            activateItem(items[selectedIndexSafe]);
        }
    };

    useEffect(() => {
        if (!listRef.current) return;
        const el = listRef.current.querySelector<HTMLElement>(
            `[data-index="${selectedIndexSafe}"]`,
        );
        el?.scrollIntoView({ block: "nearest" });
    }, [selectedIndexSafe]);

    if (!isOpen) return null;

    const userCount = results.length;
    const totalCount = items.length;
    const showEmpty =
        query.trim().length > 0 && items.length === 0 && !loading && !error;

    const tabButton = (id: Tab, label: string, count?: number) => {
        const active = tab === id;
        return (
            <button
                type="button"
                onClick={() => selectTab(id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1.5 ${
                    active
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                        : "text-noir-text-muted hover:text-noir-text-bright hover:bg-noir-surface-alt font-medium"
                }`}
            >
                {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                <span>
                    {label}
                    {count !== undefined ? ` (${count})` : ""}
                </span>
            </button>
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="Nova conversa"
        >
            <div
                className="w-full max-w-xl bg-[#111714] border border-emerald-500/30 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 pb-3 border-b border-noir-border/70 flex items-center gap-3 bg-noir-surface-alt/60">
                    <span className="flex-shrink-0 text-emerald-400">
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.2}
                            />
                        </svg>
                    </span>
                    <input
                        ref={inputRef}
                        name="search"
                        id="newConversationSearch"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                            setError("");
                        }}
                        placeholder="Buscar por nome, e-mail ou #ID..."
                        maxLength={100}
                        autoComplete="off"
                        aria-label="Buscar usuário ou grupo"
                        aria-autocomplete="list"
                        aria-controls="new-conversation-results"
                        aria-activedescendant={
                            items.length > 0
                                ? `new-conversation-result-${selectedIndexSafe}`
                                : undefined
                        }
                        className="flex-1 bg-transparent text-sm text-noir-text-bright placeholder-noir-text-muted/70 focus:outline-none font-medium"
                    />
                    {loading && (
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                    <div className="flex items-center gap-2">
                        <kbd className="text-[10px] bg-noir-surface border border-noir-border px-2 py-0.5 rounded text-noir-text-muted font-mono font-medium shadow-sm">
                            ESC
                        </kbd>
                        <button
                            type="button"
                            onClick={handleClose}
                            aria-label="Fechar"
                            className="p-1 text-noir-text-muted hover:text-noir-text-bright hover:bg-noir-surface-alt rounded-lg transition"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M6 18L18 6M6 6l12 12"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="px-4 py-2.5 flex items-center gap-2 border-b border-noir-border/50 bg-[#0d1310]">
                    {tabButton("all", "Todos", userCount + groupResults.length)}
                    {tabButton("users", "Usuários", userCount)}
                    {tabButton("groups", "Grupos")}
                </div>

                {error && (
                    <div className="px-4 py-2 bg-red-500/10 border-b border-noir-border/50">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <div
                    id="new-conversation-results"
                    ref={listRef}
                    role="listbox"
                    aria-label="Resultados da busca"
                    className="p-3 overflow-y-auto max-h-[360px] space-y-2 custom-scrollbar"
                >
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-noir-text-muted flex items-center justify-between">
                        <span>
                            {query.trim()
                                ? "Contatos sugeridos"
                                : "Buscar para começar"}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400/80 lowercase">
                            {totalCount} resultado{totalCount === 1 ? "" : "s"}
                        </span>
                    </div>

                    {!query.trim() && items.length === 0 && (
                        <p className="px-2 py-8 text-center text-noir-text-muted text-sm">
                            Digite um nome, e-mail ou #ID para buscar pessoas
                            {groupResults.length > 0
                                ? " ou escolha um grupo abaixo."
                                : "."}
                        </p>
                    )}

                    {showEmpty && (
                        <p className="px-2 py-8 text-center text-noir-text-muted text-sm">
                            {tab === "groups"
                                ? "Nenhum grupo encontrado."
                                : "Nenhum usuário encontrado."}
                        </p>
                    )}

                    {items.map((item, index) => {
                        const selected = index === selectedIndexSafe;
                        if (item.kind === "group") {
                            const room = item.room;
                            return (
                                <div
                                    key={`group-${room._id}`}
                                    data-index={index}
                                    id={`new-conversation-result-${index}`}
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => handleSelectGroup(room._id)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                                        selected
                                            ? "bg-emerald-500/10 border-emerald-500/20 border-l-2 border-l-emerald-500 shadow-sm"
                                            : "border-transparent hover:bg-noir-surface-alt/70 hover:border-noir-border/60"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative flex-shrink-0">
                                            <Avatar
                                                src={room.avatar}
                                                name={room.name}
                                                size="md"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`font-bold text-sm text-noir-text-bright ${selected ? "" : "group-hover:text-emerald-300"} transition`}
                                                >
                                                    {room.name}
                                                </span>
                                                <span className="text-[10px] bg-noir-surface border border-noir-border/80 text-noir-text-muted font-mono px-1.5 py-0.2 rounded">
                                                    GRUPO
                                                </span>
                                            </div>
                                            <p className="text-xs text-noir-text-muted truncate mt-0.5">
                                                {room.participants.length}{" "}
                                                participante
                                                {room.participants.length === 1
                                                    ? ""
                                                    : "s"}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-noir-text-muted group-hover:text-emerald-400 p-1.5 flex-shrink-0 hidden sm:inline text-[11px]">
                                        {selected ? "↵ Abrir" : "Abrir"}
                                    </span>
                                </div>
                            );
                        }

                        const user = item.user;
                        const online = isOnline(user._id);
                        const busy = creatingId === user._id;
                        return (
                            <div
                                key={user._id}
                                data-index={index}
                                id={`new-conversation-result-${index}`}
                                role="option"
                                aria-selected={selected}
                                onClick={() =>
                                    handleStartConversation(user._id)
                                }
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`group flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                                    selected
                                        ? "bg-emerald-500/10 border-emerald-500/20 border-l-2 border-l-emerald-500 shadow-sm"
                                        : "border-transparent hover:bg-noir-surface-alt/70 hover:border-noir-border/60"
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative flex-shrink-0">
                                        <Avatar
                                            src={user.avatar}
                                            name={user.name}
                                            size="md"
                                        />
                                        <span
                                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#111714] rounded-full ${
                                                online
                                                    ? "bg-emerald-500 animate-pulse"
                                                    : "bg-zinc-500"
                                            }`}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`font-bold text-sm text-noir-text-bright ${selected ? "" : "group-hover:text-emerald-300"} transition`}
                                            >
                                                {user.name}
                                            </span>
                                            <span className="text-[10px] bg-noir-surface border border-noir-border/80 text-emerald-400 font-mono px-1.5 py-0.2 rounded">
                                                #{user.publicId}
                                            </span>
                                        </div>
                                        <p className="text-xs text-noir-text-muted truncate mt-0.5">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {busy ? (
                                        <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    ) : selected ? (
                                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-600/20 border border-emerald-500/40 px-2 py-1 rounded-lg">
                                            <span className="font-mono text-xs">
                                                ↵
                                            </span>{" "}
                                            Conversar
                                        </span>
                                    ) : (
                                        <span className="text-xs text-noir-text-muted group-hover:text-emerald-400 p-1.5 rounded-lg hover:bg-noir-surface transition flex items-center gap-1">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.8}
                                                />
                                            </svg>
                                            <span className="hidden sm:inline text-[11px]">
                                                Iniciar chat
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {tab !== "users" && (
                        <>
                            <div className="px-2 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-noir-text-muted flex items-center justify-between">
                                <span>Grupos públicos</span>
                                <span className="text-[10px] font-mono text-emerald-400/80 lowercase">
                                    {publicGroups.length} disponíve
                                    {publicGroups.length === 1 ? "l" : "is"}
                                </span>
                            </div>

                            {publicLoading && publicGroups.length === 0 && (
                                <p className="px-2 py-4 text-center text-noir-text-muted text-sm">
                                    Buscando grupos públicos...
                                </p>
                            )}

                            {!publicLoading && publicGroups.length === 0 && (
                                <p className="px-2 py-4 text-center text-noir-text-muted text-sm">
                                    Nenhum grupo público disponível.
                                </p>
                            )}

                            {publicGroups.map((g) => {
                                const joining = joiningId === g._id;
                                return (
                                    <div
                                        key={`public-${g._id}`}
                                        className="flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:bg-noir-surface-alt/70 hover:border-noir-border/60 transition"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex-shrink-0">
                                                <Avatar
                                                    src={g.avatar}
                                                    name={g.name}
                                                    size="md"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-noir-text-bright truncate">
                                                        {g.name}
                                                    </span>
                                                    <span className="text-[10px] bg-noir-surface border border-noir-border/80 text-emerald-400 font-mono px-1.5 py-0.2 rounded shrink-0">
                                                        PÚBLICO
                                                    </span>
                                                </div>
                                                <p className="text-xs text-noir-text-muted truncate mt-0.5">
                                                    {g.description ||
                                                        `${g.participantCount} participante${g.participantCount === 1 ? "" : "s"}`}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={joining}
                                            onClick={() =>
                                                handleJoinPublic(g._id)
                                            }
                                            className="flex-shrink-0 ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-600/20 border border-emerald-500/40 px-2 py-1 rounded-lg hover:bg-emerald-600/30 transition disabled:opacity-50"
                                        >
                                            {joining ? (
                                                <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                "Entrar"
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                <div className="px-4 py-3 bg-[#0d1310] border-t border-noir-border/70 flex items-center justify-between text-xs text-noir-text-muted">
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-noir-surface border border-noir-border text-noir-text-bright">
                                ↑↓
                            </kbd>{" "}
                            navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-noir-surface border border-noir-border text-noir-text-bright">
                                ↵
                            </kbd>{" "}
                            selecionar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-noir-surface border border-noir-border text-noir-text-bright">
                                esc
                            </kbd>{" "}
                            fechar
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            handleClose();
                            onCreateGroup?.();
                        }}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M12 4v16m8-8H4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                            />
                        </svg>
                        <span>Criar novo grupo</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
