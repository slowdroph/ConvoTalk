import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import ConnectionBanner from "../components/Chat/ConnectionBanner";
import CallModal from "../components/Chat/CallModal";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { IncomingCallProvider, useIncomingCall } from "../contexts/IncomingCallContext";
import { WebRTCStateContext } from "../contexts/WebRTCStateContext";
import type { WebRTCState } from "../contexts/WebRTCStateContext";
import {
    getPendingMessages,
    removePendingMessage,
} from "../lib/offlineStorage";
import type { Room, Message } from "../types";

export default function ChatPage() {
    const { socket } = useSocket();
    return (
        <IncomingCallProvider socket={socket}>
            <ChatPageInner />
        </IncomingCallProvider>
    );
}

function ChatPageInner() {
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
    const [mentionUnreadCounts, setMentionUnreadCounts] = useState<
        Record<string, number>
    >({});
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [highlightMessageId, setHighlightMessageId] = useState<string | null>(
        null,
    );
    const [webrtcState, setWebrtcState] = useState<WebRTCState | null>(null);
    const initialized = useRef(false);
    const { socket, connected } = useSocket();
    const { user } = useAuth();
    const { incomingCall, setIncomingCall, setPendingAcceptedCall } = useIncomingCall();

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
            setMentionUnreadCounts(
                data.reduce((acc: Record<string, number>, r: Room) => {
                    if (r.mentionUnreadCount) acc[r._id] = r.mentionUnreadCount;
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
        setMentionUnreadCounts((prev) => {
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
        const handleMention = (payload: {
            messageId: string;
            roomId: string;
            sender: { _id: string; name: string; avatar?: string; status?: string };
            content: string;
            createdAt: string;
        }) => {
            if (payload.roomId === activeRoom) return;
            setMentionUnreadCounts((prev) => ({
                ...prev,
                [payload.roomId]: (prev[payload.roomId] || 0) + 1,
            }));
        };
        socket.on("message", handleMessage);
        socket.on("mention:new", handleMention);
        return () => {
            socket.off("message", handleMessage);
            socket.off("mention:new", handleMention);
        };
    }, [socket, user, activeRoom]);

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

    const handleAcceptGlobal = useCallback(() => {
        if (!incomingCall) return;
        setPendingAcceptedCall(incomingCall);
        const targetRoomId = incomingCall.roomId;
        const isSameRoom = targetRoomId === activeRoom;

        if (!isSameRoom) {
            navigate(`/chat/${targetRoomId}`, { replace: true });
        }

        setIncomingCall(null);
    }, [incomingCall, activeRoom, navigate, setIncomingCall, setPendingAcceptedCall]);

    const handleRejectGlobal = useCallback(() => {
        if (!incomingCall || !socket) return;
        socket.emit("call:reject", {
            callId: incomingCall.callId,
            calleeId: user?._id,
        });
        setIncomingCall(null);
    }, [incomingCall, socket, user, setIncomingCall]);

    const handleEndGlobal = useCallback(() => {
        if (webrtcState) {
            webrtcState.endCall();
        }
        setIncomingCall(null);
    }, [webrtcState, setIncomingCall]);

    const activeRoomData = rooms.find((r) => r._id === activeRoom);

    const callerParticipant = incomingCall && activeRoomData
        ? rooms.find((r) => r._id === incomingCall.roomId)?.participants.find(
              (p) => p._id === incomingCall.callerId,
          )
        : null;

    const callerName = callerParticipant?.name ?? "Usuário";
    const callerAvatar = callerParticipant?.avatar;

    const otherUser = activeRoomData?.type === "direct"
        ? activeRoomData.participants.find((p) => p._id !== user?._id)
        : null;

    return (
        <div className="h-dvh-fallback flex flex-col bg-noir-base pt-[env(safe-area-inset-top)]">
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
                    mentionUnreadCounts={mentionUnreadCounts}
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
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm rounded-lg transition-colors dark:bg-noir-surface-alt dark:border-noir-border dark:hover:bg-noir-border dark:text-noir-text-bright"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : activeRoomData ? (
                    <WebRTCStateContext.Provider value={webrtcState}>
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
                            visibility={activeRoomData.visibility}
                            onRoomUpdated={handleGroupUpdated}
                            onRoomDeleted={handleDeleteRoom}
                            onOpenSidebar={() => setSidebarOpen(true)}
                            highlightMessageId={highlightMessageId}
                            onWebRTCState={setWebrtcState}
                        />
                    </WebRTCStateContext.Provider>
                ) : rooms.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center dark:bg-noir-surface-alt">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-slate-400 dark:text-noir-text-muted"
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
                        <h3 className="text-slate-900 font-semibold dark:text-noir-text-bright">
                            Nenhuma conversa ainda
                        </h3>
                        <p className="text-slate-500 text-sm max-w-sm dark:text-noir-text-muted">
                            Comece pesquisando um usuário no menu lateral ou
                            criando um novo grupo.
                        </p>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm rounded-lg transition-colors dark:bg-noir-surface-alt dark:border-noir-border dark:hover:bg-noir-border dark:text-noir-text-bright"
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
                    <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-noir-text-muted">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm rounded-lg transition-colors dark:bg-noir-surface-alt dark:border-noir-border dark:hover:bg-noir-border dark:text-noir-text-bright"
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

            {incomingCall && (
                <CallModal
                    phase="incoming"
                    callType={incomingCall.callType}
                    remoteName={callerName}
                    remoteAvatar={callerAvatar}
                    localName={user?.name}
                    localAvatar={user?.avatar}
                    localStream={null}
                    remoteStream={null}
                    muted={false}
                    cameraOff={false}
                    isOtherOnline={true}
                    callStartTime={null}
                    onAccept={handleAcceptGlobal}
                    onReject={handleRejectGlobal}
                    onEnd={handleEndGlobal}
                    onToggleMute={() => {}}
                    onToggleCamera={() => {}}
                />
            )}

            {webrtcState && webrtcState.phase !== "idle" && !incomingCall && (
                <CallModal
                    phase={webrtcState.phase}
                    callType={webrtcState.callType}
                    remoteName={otherUser?.name ?? "Usuário"}
                    remoteAvatar={otherUser?.avatar}
                    localName={user?.name}
                    localAvatar={user?.avatar}
                    localStream={webrtcState.localStream}
                    remoteStream={webrtcState.remoteStream}
                    muted={webrtcState.muted}
                    cameraOff={webrtcState.cameraOff}
                    isOtherOnline={true}
                    callStartTime={webrtcState.callStartTime}
                    onAccept={() => {}}
                    onReject={() => {}}
                    onEnd={webrtcState.endCall}
                    onToggleMute={webrtcState.toggleMute}
                    onToggleCamera={webrtcState.toggleCamera}
                />
            )}
        </div>
    );
}
