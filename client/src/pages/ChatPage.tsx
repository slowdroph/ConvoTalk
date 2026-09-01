import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import ConnectionBanner from "../components/Chat/ConnectionBanner";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import {
    getPendingMessages,
    removePendingMessage,
} from "../lib/offlineStorage";
import type { Room, Message } from "../types";

export default function ChatPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [lastUrlRoomId, setLastUrlRoomId] = useState<string | undefined>(
        roomId,
    );
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(
        {},
    );
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [highlightMessageId, setHighlightMessageId] = useState<string | null>(
        null,
    );
    const initialized = useRef(false);
    const { socket, connected } = useSocket();
    const { user } = useAuth();

    // Ajusta a sala ativa quando a URL muda (ex.: clique em notificação push)
    if (roomId !== lastUrlRoomId) {
        setLastUrlRoomId(roomId);
        if (roomId && rooms.some((r) => r._id === roomId)) {
            setActiveRoom(roomId);
        }
    }

    useNotifications(socket, user, activeRoom);

    useEffect(() => {
        if (!connected || !navigator.onLine || !socket) return;
        let cancelled = false;

        getPendingMessages()
            .then((pending) => {
                for (const msg of pending) {
                    if (cancelled || !socket.connected) break;
                    socket.emit(
                        "message",
                        {
                            roomId: msg.roomId,
                            content: msg.content,
                            attachments: [],
                            clientMessageId: msg.id,
                        },
                        (res: { error?: string }) => {
                            if (!cancelled && !res?.error) {
                                removePendingMessage(msg.id).catch(() => {});
                            }
                        },
                    );
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [connected, socket]);

    const loadRooms = useCallback(async () => {
        setRoomsError(null);
        setRoomsLoading(true);
        try {
            const { data } = await api.get("/rooms");
            setRooms(data);
            setUnreadCounts(
                data.reduce((acc: Record<string, number>, r: Room) => {
                    if (r.unreadCount) acc[r._id] = r.unreadCount;
                    return acc;
                }, {}),
            );
            return data;
        } catch (error) {
            console.error("Erro ao carregar salas:", error);
            setRoomsError("Erro ao carregar salas. Verifique sua conexão.");
            return [];
        } finally {
            setRoomsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            loadRooms().then((data) => {
                if (data.length > 0) {
                    const initialRoom = data.find((r: Room) => r._id === roomId);
                    setActiveRoom(initialRoom ? initialRoom._id : data[0]._id);
                }
            });
        }
    }, [loadRooms, roomId]);

    const handleSelectRoom = (roomId: string, messageId?: string) => {
        setActiveRoom(roomId);
        navigate(`/chat/${roomId}`, { replace: true });
        setHighlightMessageId(messageId ?? null);
        setSidebarOpen(false);
        setUnreadCounts((prev) => {
            if (!prev[roomId]) return prev;
            const next = { ...prev };
            delete next[roomId];
            return next;
        });
    };

    const handleConversationCreated = (roomId: string) => {
        loadRooms().then(() => {
            setActiveRoom(roomId);
            navigate(`/chat/${roomId}`, { replace: true });
        });
    };

    const handleGroupCreated = (roomId: string) => {
        loadRooms().then(() => {
            setActiveRoom(roomId);
            navigate(`/chat/${roomId}`, { replace: true });
        });
    };

    const handleGroupUpdated = (room: Room) => {
        setRooms((prev) => prev.map((r) => (r._id === room._id ? room : r)));
    };

    const handleDeleteRoom = async (roomId: string) => {
        try {
            await api.delete(`/rooms/${roomId}`);
            setRooms((prev) => {
                const remaining = prev.filter((r) => r._id !== roomId);
                if (activeRoom === roomId) {
                    setActiveRoom(
                        remaining.length > 0 ? remaining[0]._id : null,
                    );
                }
                return remaining;
            });
        } catch (error) {
            console.error("Erro ao excluir conversa:", error);
        }
    };

    useEffect(() => {
        if (!socket) return;
        const handleRoomDeleted = (roomId: string) => {
            setRooms((prev) => {
                const remaining = prev.filter((r) => r._id !== roomId);
                if (activeRoom === roomId) {
                    setActiveRoom(
                        remaining.length > 0 ? remaining[0]._id : null,
                    );
                }
                return remaining;
            });
        };
        const handleRoomUpdated = (updatedRoom: Room) => {
            if (!updatedRoom?._id) return;
            setRooms((prev) =>
                prev.map((r) => (r._id === updatedRoom._id ? updatedRoom : r)),
            );
        };
        socket.on("room_deleted", handleRoomDeleted);
        socket.on("room_updated", handleRoomUpdated);
        return () => {
            socket.off("room_deleted", handleRoomDeleted);
            socket.off("room_updated", handleRoomUpdated);
        };
    }, [socket, activeRoom]);

    useEffect(() => {
        if (!socket || !user) return;
        const handleMessage = (msg: Message) => {
            if (msg.type === "system") return;
            if (msg.sender && msg.sender._id === user._id) return;
            if (msg.room === activeRoom) return;
            setUnreadCounts((prev) => ({
                ...prev,
                [msg.room]: (prev[msg.room] || 0) + 1,
            }));
        };
        socket.on("message", handleMessage);
        return () => {
            socket.off("message", handleMessage);
        };
    }, [socket, user, activeRoom]);

    const activeRoomData = rooms.find((r) => r._id === activeRoom);

    useKeyboardShortcuts(
        Array.from({ length: Math.min(9, rooms.length) }, (_, i) => ({
            key: String(i + 1),
            ctrl: true,
            handler: () => handleSelectRoom(rooms[i]._id),
        })),
    );

    useKeyboardShortcuts([
        {
            key: "Escape",
            handler: () => setSidebarOpen(false),
        },
    ]);

    return (
        <div className="h-dvh-fallback flex flex-col bg-zinc-950 pt-[env(safe-area-inset-top)]">
            <ConnectionBanner />
            <div className="flex flex-1 min-h-0">
                <Sidebar
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onSelectRoom={handleSelectRoom}
                    onConversationCreated={handleConversationCreated}
                    onGroupCreated={handleGroupCreated}
                    onDeleteRoom={handleDeleteRoom}
                    unreadCounts={unreadCounts}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                {roomsLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin dark:border-green-500" />
                    </div>
                ) : roomsError ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <p className="text-red-600 text-sm dark:text-red-400">
                            {roomsError}
                        </p>
                        <button
                            onClick={loadRooms}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm rounded-lg transition-colors dark:bg-zinc-800 dark:border-transparent dark:hover:bg-zinc-700 dark:text-white"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : activeRoomData ? (
                    <ChatWindow
                        key={activeRoom}
                        roomId={activeRoomData._id}
                        roomName={activeRoomData.name}
                        roomDescription={activeRoomData.description}
                        roomType={activeRoomData.type}
                        participants={activeRoomData.participants}
                        admins={activeRoomData.admins ?? []}
                        avatar={activeRoomData.avatar ?? ""}
                        createdBy={activeRoomData.createdBy ?? null}
                        onRoomUpdated={handleGroupUpdated}
                        onRoomDeleted={handleDeleteRoom}
                        onOpenSidebar={() => setSidebarOpen(true)}
                        highlightMessageId={highlightMessageId}
                    />
                ) : rooms.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center dark:bg-zinc-800">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-slate-400 dark:text-zinc-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-slate-900 font-semibold dark:text-white">
                            Nenhuma conversa ainda
                        </h3>
                        <p className="text-slate-500 text-sm max-w-sm dark:text-zinc-400">
                            Comece pesquisando um usuário no menu lateral ou
                            criando um novo grupo.
                        </p>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm rounded-lg transition-colors dark:bg-zinc-800 dark:border-transparent dark:hover:bg-zinc-700 dark:text-white"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            Abrir conversas
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-zinc-500">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm rounded-lg transition-colors dark:bg-zinc-800 dark:border-transparent dark:hover:bg-zinc-700 dark:text-white"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            Abrir conversas
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
