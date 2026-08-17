import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import type { Room } from "../../types";
import Avatar from "../ui/Avatar";
import ConfirmDialog from "../ui/ConfirmDialog";

interface RoomListProps {
    rooms: Room[];
    activeRoom: string | null;
    onSelectRoom: (roomId: string) => void;
    onDeleteRoom: (roomId: string) => void;
    unreadCounts: Record<string, number>;
}

export default function RoomList({
    rooms,
    activeRoom,
    onSelectRoom,
    onDeleteRoom,
    unreadCounts,
}: RoomListProps) {
    const { user } = useAuth();
    const { onlineUsers } = useSocket();
    const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

    const getDmDisplayName = (room: Room) => {
        const other = room.participants.find((p) => p._id !== user?._id);
        return other?.name || "Usuário";
    };

    const getDmAvatarUrl = (room: Room) => {
        const other = room.participants.find((p) => p._id !== user?._id);
        return other?.avatar;
    };

    const isDmOnline = (room: Room) => {
        const other = room.participants.find((p) => p._id !== user?._id);
        return other
            ? onlineUsers.some((ou) => ou.userId === other._id)
            : false;
    };

    const groupRooms = rooms.filter((r) => r.type === "group");
    const dmRooms = rooms.filter((r) => r.type === "direct");

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Salas de grupo */}
            {groupRooms.length > 0 && (
                <>
                    <div className="px-4 py-3">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-zinc-500">
                            Salas
                        </h3>
                    </div>
                    <ul>
                        {groupRooms.map((room) => (
                            <li key={room._id}>
                                <button
                                    onClick={() => onSelectRoom(room._id)}
                                    aria-current={
                                        activeRoom === room._id ? "true" : undefined
                                    }
                                    className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-colors ${
                                        activeRoom === room._id
                                            ? "bg-slate-100 text-slate-900 dark:bg-zinc-700/50 dark:text-white"
                                            : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    <Avatar
                                        src={room.avatar}
                                        name={room.name}
                                        className="shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">
                                            {room.name}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate dark:text-zinc-500">
                                            {room.description}
                                        </p>
                                    </div>
                                    {unreadCounts[room._id] ? (
                                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center dark:bg-green-600 dark:text-on-accent">
                                            {unreadCounts[room._id]}
                                        </span>
                                    ) : null}
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* Conversas diretas */}
            {dmRooms.length > 0 && (
                <>
                    <div className="px-4 py-3">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-zinc-500">
                            Conversas
                        </h3>
                    </div>
                    <ul>
                        {dmRooms.map((room) => (
                            <li key={room._id}>
                                <div
                                    className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-colors group ${
                                        activeRoom === room._id
                                            ? "bg-slate-100 text-slate-900 dark:bg-zinc-700/50 dark:text-white"
                                            : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    }`}
                                >
                                    <button
                                        onClick={() => onSelectRoom(room._id)}
                                        aria-current={
                                            activeRoom === room._id
                                                ? "true"
                                                : undefined
                                        }
                                        className="flex items-center gap-2 min-w-0 flex-1"
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar
                                                src={getDmAvatarUrl(room)}
                                                name={getDmDisplayName(room)}
                                            />
                                            {isDmOnline(room) && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:bg-green-500 dark:border-zinc-900" />
                                            )}
                                        </div>
                                        <div className="min-w-0 ">
                                            <p className="font-medium text-sm truncate">
                                                {getDmDisplayName(room)}
                                            </p>
                                            
                                        </div>
                                        {unreadCounts[room._id] ? (
                                            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center dark:bg-green-600 dark:text-on-accent">
                                                {unreadCounts[room._id]}
                                            </span>
                                        ) : null}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget(room);
                                        }}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0 dark:text-zinc-600 dark:hover:text-red-400"
                                        title="Excluir conversa"
                                        aria-label={`Excluir conversa com ${getDmDisplayName(room)}`}
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* Modal de confirmação */}
            <ConfirmDialog
                isOpen={deleteTarget !== null}
                title="Excluir conversa"
                message={
                    deleteTarget
                        ? `Tem certeza que deseja excluir a conversa com ${getDmDisplayName(deleteTarget)}? Todas as mensagens serão removidas.`
                        : ""
                }
                confirmLabel="Excluir"
                danger
                onConfirm={() => {
                    if (deleteTarget) {
                        onDeleteRoom(deleteTarget._id);
                    }
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
