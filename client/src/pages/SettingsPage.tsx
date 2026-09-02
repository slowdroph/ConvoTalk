import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileForm from "../components/Settings/ProfileForm";
import PasswordForm from "../components/Settings/PasswordForm";
import NotificationSettings from "../components/Settings/NotificationSettings";
import DeleteAccountModal from "../components/Settings/DeleteAccountModal";
import ThemeToggle from "../components/Settings/ThemeToggle";
import BlockedUsers from "../components/Settings/BlockedUsers";
import SessionManager from "../components/Settings/SessionManager";

export default function SettingsPage() {
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    return (
        <div className="min-h-dvh-fallback bg-slate-50 dark:bg-zinc-950">
            <div className="max-w-2xl mx-auto px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/chat")}
                        className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer p-2 rounded-lg"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Configurações
                    </h1>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none">
                        <ProfileForm />
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none">
                        <ThemeToggle />
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none">
                        <NotificationSettings />
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none">
                        <BlockedUsers />
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none">
                        <SessionManager />
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none">
                        <PasswordForm />
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-none">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-red-400 mb-2">
                            Zona de perigo
                        </h3>
                        <p className="text-slate-500 text-sm mb-4 dark:text-zinc-400">
                            Excluir sua conta remove todos os seus dados
                            permanentemente.
                        </p>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-6 py-3 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg transition-colors cursor-pointer dark:bg-red-600/10 dark:border dark:border-red-600/50 dark:hover:bg-red-600/20 dark:text-red-400"
                        >
                            Excluir minha conta
                        </button>
                    </div>
                </div>
            </div>

            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
