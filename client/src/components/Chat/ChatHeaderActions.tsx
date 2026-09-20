import DropdownMenu from "../ui/DropdownMenu";

interface ChatHeaderActionsProps {
    roomType: "group" | "direct";
    canManageGroup: boolean;
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

const callButtonClass =
    "p-2.5 rounded-xl transition-colors text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-noir-text-muted dark:hover:text-noir-text-bright dark:hover:bg-noir-surface-alt disabled:opacity-40 disabled:cursor-not-allowed";

const menuItemClass =
    "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition group";

const moreButtonClass =
    "p-2.5 rounded-xl transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-noir-text-muted dark:hover:text-noir-text-bright dark:hover:bg-noir-surface-alt";

export default function ChatHeaderActions({
    roomType,
    canManageGroup,
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
    pinnedCount = 0,
}: ChatHeaderActionsProps) {
    return (
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {roomType === "direct" && (
                <>
                    <button
                        onClick={() => onStartCall("audio")}
                        disabled={callDisabled}
                        className={callButtonClass}
                        title={
                            callDisabled
                                ? "Usuário indisponível"
                                : "Chamada de voz"
                        }
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
                                strokeWidth={1.8}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => onStartCall("video")}
                        disabled={callDisabled}
                        className={callButtonClass}
                        title={
                            callDisabled
                                ? "Usuário indisponível"
                                : "Vídeo chamada"
                        }
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
                                strokeWidth={1.8}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                    <div
                        className="h-6 w-px bg-noir-border mx-1"
                        aria-hidden="true"
                    />
                </>
            )}
            <DropdownMenu
                trigger={({ onClick, ...ariaProps }) => (
                    <button
                        onClick={onClick}
                        {...ariaProps}
                        className={`${moreButtonClass} ${
                            ariaProps["aria-expanded"]
                                ? "text-emerald-400 bg-emerald-600/15 border border-emerald-600/30"
                                : ""
                        }`}
                        title="Opções da conversa"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                        </svg>
                    </button>
                )}
            >
                {/* Grupo 1: Conteúdo & Busca */}
                <div className="space-y-0.5">
                    <button
                        onClick={onToggleSearch}
                        className={`${menuItemClass} ${
                            searchOpen
                                ? "bg-emerald-600/15 text-emerald-300"
                                : "text-noir-text-bright hover:bg-emerald-600/15 hover:text-emerald-300"
                        }`}
                        role="menuitem"
                    >
                        <span className="flex items-center gap-2.5">
                            <svg
                                className="w-4 h-4 text-noir-text-muted group-hover:text-emerald-400 transition"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <span>Buscar mensagens</span>
                        </span>
                    </button>
                    <button
                        onClick={onOpenPinned}
                        className={`${menuItemClass} text-noir-text-bright hover:bg-emerald-600/15 hover:text-emerald-300`}
                        role="menuitem"
                    >
                        <span className="flex items-center gap-2.5">
                            <svg
                                className="w-4 h-4 text-noir-text-muted group-hover:text-emerald-400 transition"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                />
                            </svg>
                            <span>Mensagens fixadas</span>
                        </span>
                        {pinnedCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-noir-surface border border-noir-border text-[10px] text-emerald-400 font-mono">
                                {pinnedCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Divisor */}
                <div className="my-1.5 border-t border-noir-border/60" />

                {/* Grupo 2: Ações & Exportação */}
                <div className="space-y-0.5">
                    <button
                        onClick={onOpenExport}
                        className={`${menuItemClass} text-noir-text-bright hover:bg-emerald-600/15 hover:text-emerald-300`}
                        role="menuitem"
                    >
                        <span className="flex items-center gap-2.5">
                            <svg
                                className="w-4 h-4 text-noir-text-muted group-hover:text-emerald-400 transition"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                            <span>Exportar conversa</span>
                        </span>
                    </button>
                    {roomType === "group" && canManageGroup && (
                        <button
                            onClick={onOpenGroupSettings}
                            className={`${menuItemClass} text-noir-text-bright hover:bg-emerald-600/15 hover:text-emerald-300`}
                            role="menuitem"
                        >
                            <span className="flex items-center gap-2.5">
                                <svg
                                    className="w-4 h-4 text-noir-text-muted group-hover:text-emerald-400 transition"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span>Configurações do grupo</span>
                            </span>
                        </button>
                    )}
                </div>

                {/* Divisor */}
                <div className="my-1.5 border-t border-noir-border/60" />

                {/* Grupo 3: Zona de Alerta / Risco */}
                <div className="space-y-0.5">
                    {roomType === "direct" && (
                        <button
                            onClick={onToggleBlock}
                            className={`${menuItemClass} text-red-400/90 hover:bg-red-950/30 hover:text-red-300`}
                            role="menuitem"
                        >
                            <span className="flex items-center gap-2.5">
                                <svg
                                    className="w-4 h-4 text-red-400/70 group-hover:text-red-400 transition"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.8}
                                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                    />
                                </svg>
                                <span>
                                    {isBlocked
                                        ? "Desbloquear usuário"
                                        : "Bloquear usuário"}
                                </span>
                            </span>
                        </button>
                    )}
                    <button
                        onClick={onClearConversation}
                        className={`${menuItemClass} text-red-400/90 hover:bg-red-950/30 hover:text-red-300`}
                        role="menuitem"
                    >
                        <span className="flex items-center gap-2.5">
                            <svg
                                className="w-4 h-4 text-red-400/70 group-hover:text-red-400 transition"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            <span>Limpar conversa</span>
                        </span>
                    </button>
                </div>
            </DropdownMenu>
        </div>
    );
}
