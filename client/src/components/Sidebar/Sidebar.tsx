import UserStatus from "./UserStatus";
import RoomList from "./RoomList";
import UserSearch from "./UserSearch";
import CreateGroupModal from "./CreateGroupModal";
import SearchDialog from "./SearchDialog";
import { useState } from "react";
import type { Room } from "../../types";

interface SidebarProps {
    rooms: Room[];
    activeRoom: string | null;
    onSelectRoom: (roomId: string, messageId?: string) => void;
    onConversationCreated: (roomId: string) => void;
    onGroupCreated: (roomId: string) => void;
    onDeleteRoom: (roomId: string) => void;
    unreadCounts: Record<string, number>;
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
    isOpen,
    onClose,
}: SidebarProps) {
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col h-full transition-transform duration-200 md:static md:translate-x-0 dark:bg-zinc-900 dark:border-zinc-700 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-label="Lista de conversas"
            >
                <UserStatus />
                <div className="px-2 py-2 border-b border-slate-200 space-y-1 dark:border-zinc-700">
                    <UserSearch onConversationCreated={onConversationCreated} />
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="w-full flex items-center justify-start gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
                            title="Buscar em todas as conversas"
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
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            Buscar
                        </button>
                        <button
                            onClick={() => setGroupModalOpen(true)}
                            className="w-full flex items-center justify-start gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-sm dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
                            title="Criar grupo"
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Criar grupo
                        </button>
                    </div>
                </div>
                <RoomList
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onSelectRoom={onSelectRoom}
                    onDeleteRoom={onDeleteRoom}
                    unreadCounts={unreadCounts}
                />
                <CreateGroupModal
                    isOpen={groupModalOpen}
                    onClose={() => setGroupModalOpen(false)}
                    onCreated={onGroupCreated}
                />
                <SearchDialog
                    isOpen={searchOpen}
                    onClose={() => setSearchOpen(false)}
                    onSelectResult={(roomId, messageId) => {
                        setSearchOpen(false);
                        onClose?.();
                        onSelectRoom(roomId, messageId);
                    }}
                />
            </aside>
        </>
    );
}
