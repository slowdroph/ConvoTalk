import Avatar from "../ui/Avatar";
import { formatLastSeen } from "../../utils/formatLastSeen";

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
    blockMenuOpen: boolean;
    onToggleBlockMenu: () => void;
    isBlocked: boolean;
    onToggleBlock: () => void;
    searchOpen: boolean;
    onToggleSearch: () => void;
    onOpenExport: () => void;
    onOpenPinned: () => void;
    onOpenGroupSettings: () => void;
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
    blockMenuOpen,
    onToggleBlockMenu,
    isBlocked,
    onToggleBlock,
    searchOpen,
    onToggleSearch,
    onOpenExport,
    onOpenPinned,
    onOpenGroupSettings,
}: ChatHeaderProps) {
    return (
        <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between gap-2">
            <h2 className="text-slate-900 font-semibold flex items-center gap-2 min-w-0 dark:text-white">
                {onOpenSidebar && (
                    <button
                        onClick={onOpenSidebar}
                        className="p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 md:hidden shrink-0"
                        title="Abrir lista de conversas"
                        aria-label="Abrir lista de conversas"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}
                <Avatar src={avatarUrl || undefined} name={avatarName} size="sm" />
                <span className="flex flex-col truncate">
                    <span className="truncate">{displayName}</span>
                    {roomType === "direct" ? (
                        <span className="flex items-center gap-1 text-xs font-normal">
                            <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                    isOtherOnline ? "bg-green-500" : "bg-zinc-600"
                                }`}
                            />
                            <span
                                className={
                                    isOtherOnline ? "text-green-400" : "text-zinc-500"
                                }
                            >
                                {isOtherOnline
                                    ? "Online"
                                    : formatLastSeen(otherUserLastSeen)}
                            </span>
                        </span>
                    ) : (
                        <span className="text-xs font-normal text-zinc-500">
                            {onlineCount > 0
                                ? `${onlineCount} online`
                                : `${participantCount} participantes`}
                        </span>
                    )}
                    {roomType === "direct" && otherStatus && (
                        <span className="text-xs font-normal text-zinc-500 truncate">
                            {otherStatus}
                        </span>
                    )}
                </span>
            </h2>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 overflow-x-auto">
                {roomType === "direct" && (
                    <>
                        <button
                            onClick={() => onStartCall("audio")}
                            disabled={callDisabled}
                            className="p-1.5 sm:p-2 rounded-lg transition-colors text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-green-400 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={callDisabled ? "Usuário indisponível" : "Chamada de voz"}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onStartCall("video")}
                            disabled={callDisabled}
                            className="p-1.5 sm:p-2 rounded-lg transition-colors text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-green-400 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={callDisabled ? "Usuário indisponível" : "Vídeo chamada"}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <div className="w-px h-5 bg-zinc-700 mx-0.5 sm:mx-1" aria-hidden="true" />
                        <div className="relative">
                            <button
                                onClick={onToggleBlockMenu}
                                className="p-1.5 sm:p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800"
                                title="Mais opções"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5h.01M12 12h.01M12 19h.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                            {blockMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg min-w-40 dark:bg-zinc-800 dark:border-zinc-700">
                                    <button
                                        onClick={onToggleBlock}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors text-slate-700 dark:hover:bg-zinc-700 dark:text-zinc-200"
                                    >
                                        {isBlocked ? "Desbloquear usuário" : "Bloquear usuário"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
                <button
                    onClick={onToggleSearch}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                        searchOpen
                            ? "bg-emerald-500/20 text-emerald-700 dark:bg-green-600/20 dark:text-green-400"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800"
                    }`}
                    title="Buscar mensagens (Ctrl+F)"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
                <button
                    onClick={onOpenExport}
                    className="p-1.5 sm:p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800"
                    title="Exportar conversa"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                <button
                    onClick={onOpenPinned}
                    className="p-1.5 sm:p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800"
                    title="Mensagens fixadas"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3h12M9 3v4l-3 5a2 2 0 002 2h8a2 2 0 002-2l-3-5V3M9 21h6" />
                    </svg>
                </button>
                {roomType === "group" && (
                    <button
                        onClick={onOpenGroupSettings}
                        className="p-1.5 sm:p-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800"
                        title="Configurações do grupo"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}