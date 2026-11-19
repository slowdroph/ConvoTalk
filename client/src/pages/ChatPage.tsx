import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import ChatWindow from "../components/Chat/ChatWindow";
import ConnectionBanner from "../components/Chat/ConnectionBanner";
import CallModal from "../components/Chat/CallModal";
import SuggestedUsers from "../components/Chat/SuggestedUsers";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import { useRooms } from "../hooks/useRooms";
import { useNotifications } from "../hooks/useNotifications";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { IncomingCallProvider, useIncomingCall } from "../contexts/IncomingCallContext";
import { WebRTCStateContext } from "../contexts/WebRTCStateContext";
import type { WebRTCState } from "../contexts/WebRTCStateContext";
import {
    getPendingMessages,
    removePendingMessage,
} from "../lib/offlineStorage";
import type { Room } from "../types";

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
    const {
        rooms,
        roomsLoading,
        roomsError,
        activeRoom,
        setActiveRoom,
        unreadCounts,
        mentionUnreadCounts,
        loadRooms,
        markRoomRead,
        removeRoom,
        updateRoom,
    } = useRooms();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [highlightMessageId, setHighlightMessageId] = useState<string | null>(
        null,
    );
    const [webrtcState, setWebrtcState] = useState<WebRTCState | null>(null);
    const { socket, connected } = useSocket();
    const { user } = useAuth();
    const { incomingCall, setIncomingCall, setPendingAcceptedCall } = useIncomingCall();

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

    useEffect(() => {
        if (roomsLoading) return;
        if (roomId) {
            const match = rooms.find((room) => room._id === roomId);
            if (match) {
                setActiveRoom(match._id);
                markRoomRead(match._id);
                return;
            }
        }
        if (!activeRoom && rooms.length > 0) {
            setActiveRoom(rooms[0]._id);
        }
    }, [roomId, rooms, roomsLoading, activeRoom, setActiveRoom, markRoomRead]);

    useEffect(() => {
        return () => setActiveRoom(null);
    }, [setActiveRoom]);

    const handleSelectRoom = (roomId: string, messageId?: string) => {
        setActiveRoom(roomId);
        markRoomRead(roomId);
        navigate(`/chat/${roomId}`, { replace: true });
        setHighlightMessageId(messageId ?? null);
        setSidebarOpen(false);
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
        updateRoom(room);
    };

    const handleDeleteRoom = async (roomId: string) => {
        try {
            await api.delete(`/rooms/${roomId}`);
            removeRoom(roomId);
        } catch (error) {
            console.error("Erro ao excluir conversa:", error);
        }
    };

    const handleLeaveRoom = (roomId: string) => {
        const remaining = rooms.filter((room) => room._id !== roomId);
        removeRoom(roomId);
        if (activeRoom === roomId) {
            const next = remaining.length > 0 ? remaining[0]._id : null;
            setActiveRoom(next);
            navigate(next ? `/chat/${next}` : "/chat", { replace: true });
        }
    };

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
        <div className="flex h-full min-h-0 flex-col bg-noir-base">
            <ConnectionBanner />
            <div className="flex flex-1 min-h-0 min-w-0">
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
                            onRoomLeft={handleLeaveRoom}
                            onOpenSidebar={() => setSidebarOpen(true)}
                            highlightMessageId={highlightMessageId}
                            initialPinnedMessageIds={(
                                activeRoomData.pinnedMessages ?? []
                            ).map((p) => String(p.message))}
                            onWebRTCState={setWebrtcState}
                        />
                    </WebRTCStateContext.Provider>
                ) : rooms.length === 0 ? (
                    <div className="flex-1 flex flex-col gap-5 p-6 pt-8 overflow-y-auto min-h-0">
                        <div className="text-center">
                            <h3 className="text-slate-900 font-semibold dark:text-noir-text-bright">
                                Nenhuma conversa ainda
                            </h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1 dark:text-noir-text-muted">
                                Comece uma nova conversa com alguém abaixo ou crie
                                um grupo.
                            </p>
                        </div>
                        <SuggestedUsers
                            onConversationCreated={handleConversationCreated}
                        />
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden self-center flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm rounded-lg transition-colors dark:bg-noir-surface-alt dark:border-noir-border dark:hover:bg-noir-border dark:text-noir-text-bright"
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
