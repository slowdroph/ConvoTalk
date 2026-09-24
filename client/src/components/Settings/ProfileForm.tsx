import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Avatar from "../ui/Avatar";

export default function ProfileForm() {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [status, setStatus] = useState(user?.status || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("A imagem deve ter no máximo 5MB.");
            return;
        }

        const prevPreview = preview;
        setPreview(URL.createObjectURL(file));
        if (prevPreview) URL.revokeObjectURL(prevPreview);
        setError("");
        setAvatarLoading(true);

        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const { data } = await api.put("/user/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            updateUser(data);
            setSuccess("Foto de perfil atualizada!");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao fazer upload da imagem"));
            setPreview(null);
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setError("");
        setAvatarLoading(true);

        try {
            const { data } = await api.delete("/user/avatar");
            updateUser(data);
            setPreview(null);
            setSuccess("Foto de perfil removida!");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao remover avatar"));
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setProfileLoading(true);

        const emailChanged =
            email.toLowerCase() !== (user?.email || "").toLowerCase();

        try {
            const { data } = await api.put("/user/profile", {
                name,
                email,
                currentPassword: emailChanged ? currentPassword : "",
            });
            updateUser(data);
            if (emailChanged) {
                setSuccess(
                    `Confirme o novo email clicando no link enviado para ${data.pendingEmail || email}. Seu email atual continua ativo até a confirmação.`,
                );
                setCurrentPassword("");
                setEmail(user?.email || "");
            } else {
                setSuccess("Perfil atualizado com sucesso!");
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao atualizar perfil"));
        } finally {
            setProfileLoading(false);
        }
    };

    const handleStatusSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setStatusLoading(true);

        try {
            const { data } = await api.put("/user/status", { status });
            updateUser({ ...user!, status: data.status });
            setSuccess("Status atualizado!");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao atualizar status"));
        } finally {
            setStatusLoading(false);
        }
    };

    const avatarUrl = preview || user?.avatar;
    const emailChanged =
        email.toLowerCase() !== (user?.email || "").toLowerCase();

    return (
        <div className="space-y-6">
            <div className="border-b border-noir-border pb-4">
                <h2 className="text-base font-semibold text-noir-text-bright">
                    Perfil &amp; Informações
                </h2>
                <p className="text-xs text-noir-text-muted mt-0.5">
                    Atualize seus dados de exibição, foto de perfil e mensagem de status.
                </p>
            </div>

            {user?.emailPending && user.pendingEmail && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-xs flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                        Alteração de email pendente: confirme o link enviado para{" "}
                        <strong className="text-amber-200">{user.pendingEmail}</strong>. Seu email atual continua ativo até a confirmação.
                    </span>
                </div>
            )}

            {success && (
                <div role="alert" className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{success}</span>
                </div>
            )}

            {error && (
                <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Controle de Avatar */}
            <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative group">
                    <Avatar
                        src={avatarUrl || undefined}
                        name={user?.name || "?"}
                        size="lg"
                        className="w-16 h-16 rounded-full border-2 border-noir-border shadow-md ring-2 ring-emerald-500/20"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-noir-card" />
                    {avatarLoading && (
                        <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <input
                        ref={fileInputRef}
                        type="file"
                        name="avatar"
                        id="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-noir-surface-alt hover:bg-noir-card text-xs font-medium text-noir-text-bright border border-noir-border-light transition disabled:opacity-50 cursor-pointer"
                    >
                        Alterar foto
                    </button>
                    {avatarUrl && (
                        <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={avatarLoading}
                            className="px-3.5 py-1.5 rounded-lg bg-noir-surface/60 hover:bg-red-950/40 text-xs font-medium text-noir-text-muted hover:text-red-400 border border-noir-border transition disabled:opacity-50 cursor-pointer"
                        >
                            Remover
                        </button>
                    )}
                </div>
            </div>

            {/* Seu ID público */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-950/20 max-w-2xl">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-noir-text-bright">
                        Seu ID para conversas
                    </p>
                    <p className="text-xs text-noir-text-muted mt-0.5">
                        Compartilhe{" "}
                        <span className="font-mono text-emerald-300">
                            #{user?.publicId}
                        </span>{" "}
                        para que outras pessoas iniciem conversa com você sem
                        expor seu email.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (user?.publicId) {
                            navigator.clipboard?.writeText(
                                `#${user.publicId}`,
                            );
                            setSuccess("ID copiado!");
                        }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition shrink-0 cursor-pointer"
                >
                    Copiar ID
                </button>
            </div>

            {/* Formulário Principal */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                <div>
                    <label
                        htmlFor="input-nome"
                        className="block text-xs font-medium text-noir-text-bright mb-1.5"
                    >
                        Nome
                    </label>
                    <input
                        type="text"
                        id="input-nome"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={50}
                        className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label
                            htmlFor="input-email"
                            className="block text-xs font-medium text-noir-text-bright"
                        >
                            Email
                        </label>
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verificado
                        </span>
                    </div>
                    <input
                        type="email"
                        id="input-email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                    />
                </div>

                {emailChanged && (
                    <div className="p-3.5 rounded-xl border border-noir-border bg-noir-surface-alt space-y-2">
                        <label
                            htmlFor="currentPassword"
                            className="block text-xs font-medium text-noir-text-bright"
                        >
                            Senha atual para confirmação
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="Digite sua senha atual"
                            className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2 text-sm text-noir-text-bright focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                        />
                        <p className="text-[11px] text-noir-text-muted">
                            Um link de confirmação será enviado para o novo email. Seu email atual continua ativo até você confirmar.
                        </p>
                    </div>
                )}

                <div className="pt-1">
                    <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs tracking-wide shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {profileLoading ? "Salvando..." : "Salvar alterações"}
                    </button>
                </div>
            </form>

            {/* Seção de Status */}
            <div className="pt-5 border-t border-noir-border max-w-2xl">
                <form onSubmit={handleStatusSubmit} className="space-y-3">
                    <label
                        htmlFor="input-status"
                        className="block text-xs font-medium text-noir-text-bright"
                    >
                        Status
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="input-status"
                            name="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            maxLength={100}
                            placeholder="Ex: Disponível, Em reunião, Não me perturbe..."
                            className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-noir-text-bright placeholder-noir-text-muted focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={statusLoading}
                            className="px-4 py-2 rounded-xl bg-noir-surface-alt hover:bg-noir-card text-noir-text-bright font-medium text-xs border border-noir-border-light transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {statusLoading ? "Salvando..." : "Salvar status"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
