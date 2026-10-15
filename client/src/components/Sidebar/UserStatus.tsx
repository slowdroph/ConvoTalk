import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../contexts/ToastContext";
import Avatar from "../ui/Avatar";

export default function UserStatus() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timeout = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(timeout);
    }, [copied]);

    const handleCopyId = async () => {
        if (!user?.publicId) return;
        try {
            await navigator.clipboard.writeText(`#${user.publicId}`);
            setCopied(true);
            showToast({ type: "success", message: "ID copiado!" });
        } catch {
            showToast({
                type: "error",
                message: "Não foi possível copiar o ID.",
            });
        }
    };

    return (
        <div className="flex items-center justify-between p-4 border-b border-noir-border bg-noir-surface/90 backdrop-blur">
            <div className="flex items-center gap-3 min-w-0">
                <Avatar src={user?.avatar} name={user?.name || "?"} />
                <div className="min-w-0">
                    <p className="text-slate-900 font-medium text-sm truncate dark:text-noir-text-bright">
                        {user?.name}
                    </p>
                    <div className="flex items-center gap-1 min-w-0">
                        <p className="min-w-0 text-slate-500 text-xs font-mono truncate dark:text-noir-text-muted">
                            #{user?.publicId}
                        </p>
                        <button
                            type="button"
                            onClick={handleCopyId}
                            title={copied ? "ID copiado!" : "Copiar ID"}
                            aria-label={copied ? "ID copiado" : "Copiar ID"}
                            className={`shrink-0 p-1 rounded-lg transition-colors cursor-pointer ${
                                copied
                                    ? "text-emerald-500 dark:text-emerald-400"
                                    : "text-slate-400 hover:text-slate-900 dark:text-noir-text-muted dark:hover:text-noir-text-bright"
                            }`}
                        >
                            {copied ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => navigate("/settings")}
                    className="text-slate-500 hover:text-slate-900 transition-colors text-sm dark:text-noir-text-muted dark:hover:text-noir-text-bright dark:hover:bg-noir-surface-alt p-2 rounded-lg"
                    title="Configurações"
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                </button>
                <button
                    onClick={logout}
                    className="text-slate-500 hover:text-red-600 transition-colors text-sm dark:text-noir-text-muted dark:hover:text-red-400 dark:hover:bg-red-950/20 p-2 rounded-lg"
                    title="Sair"
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
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}
