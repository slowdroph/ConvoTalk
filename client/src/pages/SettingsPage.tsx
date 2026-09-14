import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/ui/Avatar";
import ProfileForm from "../components/Settings/ProfileForm";
import PasswordForm from "../components/Settings/PasswordForm";
import NotificationSettings from "../components/Settings/NotificationSettings";
import DeleteAccountModal from "../components/Settings/DeleteAccountModal";
import ThemeToggle from "../components/Settings/ThemeToggle";
import BlockedUsers from "../components/Settings/BlockedUsers";
import SessionManager from "../components/Settings/SessionManager";

type TabKey =
    | "perfil"
    | "seguranca"
    | "sessoes"
    | "aparencia"
    | "notificacoes"
    | "bloqueios"
    | "perigo";

interface TabDefinition {
    id: TabKey;
    label: string;
    category: "Conta & Perfil" | "Preferências" | "Avançado";
    title: string;
    description: string;
}

const TABS: TabDefinition[] = [
    {
        id: "perfil",
        label: "Perfil & Informações",
        category: "Conta & Perfil",
        title: "Perfil & Informações",
        description: "Gerencie suas informações cadastrais, foto de exibição e mensagem de status.",
    },
    {
        id: "seguranca",
        label: "Segurança & Acesso",
        category: "Conta & Perfil",
        title: "Segurança & Acesso",
        description: "Mantenha sua conta protegida alterando periodicamente sua senha de acesso.",
    },
    {
        id: "sessoes",
        label: "Sessões Ativas",
        category: "Conta & Perfil",
        title: "Sessões Ativas",
        description: "Monitore os navegadores e dispositivos conectados à sua conta ConvoTalk.",
    },
    {
        id: "aparencia",
        label: "Aparência",
        category: "Preferências",
        title: "Aparência",
        description: "Alterne o tema da interface para melhor conforto visual.",
    },
    {
        id: "notificacoes",
        label: "Notificações",
        category: "Preferências",
        title: "Notificações",
        description: "Ajuste os alertas sonoros, avisos no navegador e contadores de mensagens.",
    },
    {
        id: "bloqueios",
        label: "Usuários Bloqueados",
        category: "Preferências",
        title: "Usuários Bloqueados",
        description: "Visualize e gerencie a lista de usuários bloqueados de interagir com você.",
    },
    {
        id: "perigo",
        label: "Zona de Perigo",
        category: "Avançado",
        title: "Zona de Perigo",
        description: "Ações irreversíveis relacionadas ao encerramento e exclusão da sua conta.",
    },
];

export default function SettingsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabKey>("perfil");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

    const accountTabs = TABS.filter((t) => t.category === "Conta & Perfil");
    const preferenceTabs = TABS.filter((t) => t.category === "Preferências");
    const advancedTabs = TABS.filter((t) => t.category === "Avançado");

    const getTabIcon = (id: TabKey) => {
        switch (id) {
            case "perfil":
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                );
            case "seguranca":
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                );
            case "sessoes":
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                );
            case "aparencia":
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                );
            case "notificacoes":
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                );
            case "bloqueios":
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                );
            case "perigo":
                return (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                );
        }
    };

    const renderTabButton = (tab: TabDefinition) => {
        const isActive = activeTab === tab.id;
        const isDanger = tab.id === "perigo";

        return (
            <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    isActive
                        ? isDanger
                            ? "text-red-400 bg-red-950/20 border-red-500/30"
                            : "text-emerald-400 bg-noir-card border-emerald-500/30"
                        : isDanger
                          ? "text-red-400/80 hover:text-red-300 hover:bg-red-950/20 border-transparent"
                          : "text-noir-text-muted hover:text-noir-text-bright hover:bg-noir-surface-alt/60 border-transparent"
                }`}
            >
                <span className="flex items-center gap-2.5 truncate">
                    <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        {getTabIcon(tab.id)}
                    </svg>
                    <span className="truncate">{tab.label}</span>
                </span>
                {isActive && (
                    <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isDanger ? "bg-red-400" : "bg-emerald-400"
                        }`}
                    />
                )}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-noir-base text-noir-text-bright flex flex-col font-sans selection:bg-emerald-600 selection:text-white antialiased">
            {/* Cabeçalho de Navegação */}
            <header className="h-16 border-b border-noir-border bg-noir-surface/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
                {/* Lado esquerdo: Link Voltar, Marca e Breadcrumbs */}
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <button
                        onClick={() => navigate("/chat")}
                        className="inline-flex items-center gap-2 text-xs font-medium text-noir-text-muted hover:text-noir-text-bright px-2.5 py-1.5 rounded-lg hover:bg-noir-surface-alt/60 transition-colors cursor-pointer shrink-0"
                        title="Voltar para a área de chats"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        <span className="hidden sm:inline">Voltar ao Chat</span>
                    </button>

                    <div className="h-4 w-px bg-noir-border shrink-0" />

                    <div className="flex items-center gap-2.5 shrink-0">
                        <img
                            src="/convo_talk_logo.png"
                            alt="ConvoTalk Logo"
                            className="w-8 h-8 rounded-xl object-contain shadow-md shadow-emerald-950/40"
                        />
                        <span className="text-sm font-semibold tracking-wide text-noir-text-bright">
                            ConvoTalk
                        </span>
                    </div>

                    {/* Breadcrumbs */}
                    <nav
                        aria-label="Breadcrumb"
                        className="hidden lg:flex items-center gap-2 text-xs text-noir-text-muted pl-4 border-l border-noir-border truncate"
                    >
                        <span className="text-noir-text-muted">Configurações</span>
                        <span>/</span>
                        <span className="text-emerald-400 font-medium truncate">
                            {currentTab.category}
                        </span>
                    </nav>
                </div>

                {/* Lado direito: Perfil do usuário logado */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex flex-col text-right min-w-0">
                        <span className="text-xs font-semibold text-noir-text-bright truncate">
                            {user?.name}
                        </span>
                        <span className="text-[11px] text-noir-text-muted font-mono truncate">
                            {user?.email}
                        </span>
                    </div>
                    <Avatar
                        src={user?.avatar}
                        name={user?.name || "?"}
                        size="sm"
                        className="w-9 h-9 rounded-full ring-2 ring-emerald-500/30 shadow"
                    />
                </div>
            </header>

            {/* Conteúdo Principal */}
            <div className="flex-1 max-w-[1480px] w-full ml-0 mr-auto flex flex-col md:flex-row overflow-hidden">
                {/* Barra Lateral de Abas */}
                <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-noir-border bg-noir-surface-alt shrink-0 flex flex-col p-4 md:p-6 justify-between">
                    <div className="space-y-6">
                        {/* Seletor Mobile Scrollable */}
                        <div className="md:hidden overflow-x-auto pb-1 flex gap-1.5 custom-scrollbar">
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${
                                        activeTab === t.id
                                            ? t.id === "perigo"
                                                ? "text-red-400 bg-red-950/30 border-red-500/40"
                                                : "text-emerald-400 bg-noir-card border-emerald-500/30"
                                            : "text-noir-text-muted bg-noir-surface/60 border-noir-border hover:text-noir-text-bright"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Grupos de Abas para Desktop */}
                        <div className="hidden md:block space-y-6">
                            {/* Conta & Perfil */}
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-noir-text-muted px-3">
                                    Conta &amp; Perfil
                                </span>
                                <nav className="mt-2 space-y-1">
                                    {accountTabs.map(renderTabButton)}
                                </nav>
                            </div>

                            {/* Preferências */}
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-noir-text-muted px-3">
                                    Preferências
                                </span>
                                <nav className="mt-2 space-y-1">
                                    {preferenceTabs.map(renderTabButton)}
                                </nav>
                            </div>

                            {/* Avançado */}
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-noir-text-muted px-3">
                                    Avançado
                                </span>
                                <nav className="mt-2 space-y-1">
                                    {advancedTabs.map(renderTabButton)}
                                </nav>
                            </div>
                        </div>
                    </div>


                </aside>

                {/* Painel Central das Configurações (Renderiza somente a aba ativa) */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-noir-base space-y-6">
                    {/* Top Overview Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-noir-border">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-noir-text-bright">
                                {currentTab.title}
                            </h1>
                            <p className="text-xs sm:text-sm text-noir-text-muted mt-1">
                                {currentTab.description}
                            </p>
                        </div>
                    </div>

                    {/* Conteúdo Exclusivo da Aba Ativa */}
                    <div className="transition-all duration-150">
                        {activeTab === "perfil" && (
                            <section className="bg-noir-card border border-noir-border rounded-2xl p-5 sm:p-6 shadow-xl">
                                <ProfileForm />
                            </section>
                        )}

                        {activeTab === "seguranca" && (
                            <section className="bg-noir-card border border-noir-border rounded-2xl p-5 sm:p-6 shadow-xl">
                                <PasswordForm />
                            </section>
                        )}

                        {activeTab === "sessoes" && (
                            <section className="bg-noir-card border border-noir-border rounded-2xl p-5 sm:p-6 shadow-xl">
                                <SessionManager />
                            </section>
                        )}

                        {activeTab === "aparencia" && (
                            <section className="bg-noir-card border border-noir-border rounded-2xl p-5 sm:p-6 shadow-xl max-w-2xl">
                                <ThemeToggle />
                            </section>
                        )}

                        {activeTab === "notificacoes" && (
                            <section className="bg-noir-card border border-noir-border rounded-2xl p-5 sm:p-6 shadow-xl max-w-2xl">
                                <NotificationSettings />
                            </section>
                        )}

                        {activeTab === "bloqueios" && (
                            <section className="bg-noir-card border border-noir-border rounded-2xl p-5 sm:p-6 shadow-xl">
                                <BlockedUsers />
                            </section>
                        )}

                        {activeTab === "perigo" && (
                            <section className="bg-red-950/10 border border-red-900/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                                <div className="border-b border-red-900/30 pb-4">
                                    <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
                                        <svg
                                            className="w-5 h-5 text-red-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                        Zona de Perigo
                                    </h2>
                                    <p className="text-xs text-noir-text-muted mt-1">
                                        Ações nesta área são permanentes e não podem ser desfeitas.
                                    </p>
                                </div>
                                <p className="text-xs text-noir-text-bright leading-relaxed max-w-2xl">
                                    Excluir sua conta removerá todos os seus dados cadastrais, mensagens enviadas, mídias e conversas permanentemente do ConvoTalk.
                                </p>
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="px-4 py-2.5 rounded-xl border border-red-800/80 bg-red-950/40 hover:bg-red-900/50 text-red-300 font-medium text-xs transition duration-150 hover:shadow-lg hover:shadow-red-950/50 cursor-pointer"
                                    >
                                        Excluir minha conta
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal de confirmação de exclusão */}
            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            />
        </div>
    );
}

