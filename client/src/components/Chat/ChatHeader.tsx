import Avatar from "../ui/Avatar";
import { formatLastSeen } from "../../utils/formatLastSeen";
import ChatHeaderActions from "./ChatHeaderActions";

interface ChatHeaderProps {
    roomType: "group" | "direct";
    displayName: string;
    avatarUrl?: string;
    avatarName: string;
    isOtherOnline: boolean;
    onlineCount: number;
    participantCount: number;
    otherUserLastSeen: string | null;
    otherStatus?: string;
    onOpenSidebar?: () => void;
    callDisabled: boolean;
    onStartCall: (type: "audio" | "video") => void;
    isBlocked: boolean;
    onToggleBlock: () => void;
    searchOpen: boolean;
    onToggleSearch: () => void;
    onOpenExport: () => void;
    onOpenPinned: () => void;
    onOpenGroupSettings: () => void;
    onClearConversation: () => void;
    pinnedCount?: number;
}

export default function ChatHeader({
    roomType,
    displayName,
    avatarUrl,
    avatarName,
    isOtherOnline,
    onlineCount,
    participantCount,
    otherUserLastSeen,
    otherStatus,
    onOpenSidebar,
    callDisabled,
    onStartCall,
    isBlocked,
    onToggleBlock,
    searchOpen,
    onToggleSearch,
    onOpenExport,
    onOpenPinned,
    onOpenGroupSettings,
    onClearConversation,
    pinnedCount,
}: ChatHeaderProps) {
    return (
        <div className="h-16 px-4 sm:px-6 border-b border-noir-border bg-noir-surface/90 flex items-center justify-between gap-2">
            <h2 className="text-slate-900 font-semibold flex items-center gap-2 min-w-0 dark:text-noir-text-bright">
                {onOpenSidebar && (
                    <button
                        onClick={onOpenSidebar}
                        className="p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-noir-text-muted dark:hover:text-noir-text-bright dark:hover:bg-noir-surface-alt md:hidden shrink-0"
                        title="Abrir lista de conversas"
                        aria-label="Abrir lista de conversas"
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
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                )}
                <Avatar
                    src={avatarUrl || undefined}
                    name={avatarName}
                    size="sm"
                />
                <span className="flex flex-col truncate">
                    <span className="truncate">{displayName}</span>
                    {roomType === "direct" ? (
                        <span className="flex items-center gap-1 text-xs font-normal">
                            <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                    isOtherOnline
                                        ? "bg-emerald-500"
                                        : "dark:bg-noir-border"
                                }`}
                            />
                            <span
                                className={
                                    isOtherOnline
                                        ? "text-emerald-400"
                                        : "dark:text-noir-text-muted"
                                }
                            >
                                {isOtherOnline
                                    ? "Online"
                                    : formatLastSeen(otherUserLastSeen)}
                            </span>
                        </span>
                    ) : (
                        <span className="text-xs font-normal dark:text-noir-text-muted">
                            {onlineCount > 0
                                ? `${onlineCount} online`
                                : `${participantCount} participantes`}
                        </span>
                    )}
                    {roomType === "direct" && otherStatus && (
                        <span className="text-xs font-normal dark:text-noir-text-muted truncate">
                            {otherStatus}
                        </span>
                    )}
                </span>
            </h2>
            <ChatHeaderActions
                roomType={roomType}
                callDisabled={callDisabled}
                onStartCall={onStartCall}
                isBlocked={isBlocked}
                onToggleBlock={onToggleBlock}
                searchOpen={searchOpen}
                onToggleSearch={onToggleSearch}
                onOpenExport={onOpenExport}
                onOpenPinned={onOpenPinned}
                onOpenGroupSettings={onOpenGroupSettings}
                onClearConversation={onClearConversation}
                pinnedCount={pinnedCount}
            />
        </div>
    );
}
