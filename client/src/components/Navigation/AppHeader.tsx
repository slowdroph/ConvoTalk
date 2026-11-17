import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../ui/Avatar";
import AppNavTabs from "./AppNavTabs";

export default function AppHeader() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 px-4 py-2.5 backdrop-blur-md transition-all dark:border-noir-border/80 dark:bg-noir-surface/90 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <div className="flex select-none items-center gap-2.5 p-1">
                    <button
                        type="button"
                        onClick={() => navigate("/feed")}
                        className="flex items-center gap-2.5"
                        aria-label="Ir para o feed"
                    >
                        <img
                            src="/convo_talk_logo.png"
                            alt="ConvoTalk"
                            className="h-8 w-auto object-contain"
                        />
                        <span className="hidden text-lg font-bold tracking-tight text-slate-900 dark:text-noir-text-bright sm:inline">
                            ConvoTalk
                        </span>
                    </button>
                </div>

                <AppNavTabs variant="pill" />

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => navigate("/settings")}
                        aria-label="Abrir configurações"
                        title="Configurações"
                        className="rounded-xl border border-transparent p-2 text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-noir-text-muted dark:hover:border-noir-border dark:hover:bg-noir-surface-alt dark:hover:text-noir-text-bright"
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
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </button>
                    {user && (
                        <Link
                            to="/profile"
                            aria-label="Abrir meu perfil"
                            title="Meu perfil"
                            className="rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                        >
                            <Avatar
                                src={user.avatar}
                                name={user.name}
                                size="sm"
                            />
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
