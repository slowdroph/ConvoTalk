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
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Perfil
            </h3>

            {user?.emailPending && user.pendingEmail && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm dark:bg-amber-500/10 dark:border-amber-500/50 dark:text-amber-400">
                    Alteração de email pendente: confirme o link enviado para{" "}
                    <strong>{user.pendingEmail}</strong> para concluir a
                    alteração. Seu email atual continua ativo até a
                    confirmação.
                </div>
            )}

            {success && (
                <div role="alert" className="bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm dark:bg-green-500/10 dark:border-green-500/50 dark:text-green-400">
                    {success}
                </div>
            )}

            {error && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar
                        src={avatarUrl || undefined}
                        name={user?.name || "?"}
                        size="lg"
                        className="border-2 border-slate-200 dark:border-zinc-700"
                    />
                    {avatarLoading && (
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
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
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-50 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer dark:bg-zinc-700 dark:border-transparent dark:hover:bg-zinc-600 dark:text-white"
                    >
                        Alterar foto
                    </button>
                    {avatarUrl && (
                        <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={avatarLoading}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-50 text-slate-600 text-sm font-medium rounded-lg transition-colors cursor-pointer dark:bg-zinc-800 dark:border-transparent dark:hover:bg-zinc-700 dark:text-zinc-400"
                        >
                            Remover foto
                        </button>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="name" className="block text-sm text-slate-600 mb-1 dark:text-zinc-400">
                    Nome
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={50}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-green-500"
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm text-slate-600 mb-1 dark:text-zinc-400">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-green-500"
                />
            </div>

            {emailChanged && (
                <div>
                    <label
                        htmlFor="currentPassword"
                        className="block text-sm text-slate-600 mb-1 dark:text-zinc-400"
                    >
                        Senha atual
                    </label>
                    <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="Para alterar o email, confirme sua senha"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-green-500"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                        Um link de confirmação será enviado para o novo email.
                        Seu email atual continua ativo até você confirmar.
                    </p>
                </div>
            )}

            <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors cursor-pointer dark:bg-green-600 dark:hover:bg-green-700 dark:text-on-accent"
            >
                {profileLoading ? "Salvando..." : "Salvar alterações"}
            </button>

            <div className="border-t border-slate-200 pt-4 dark:border-zinc-800">
                <label htmlFor="status" className="block text-sm text-slate-600 mb-1 dark:text-zinc-400">
                    Status
                </label>
                <input
                    type="text"
                    name="status"
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    maxLength={100}
                    placeholder="Ex: Disponível, Em reunião, Não me perturbe..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-green-500"
                />
                <button
                    type="button"
                    onClick={handleStatusSubmit}
                    disabled={statusLoading}
                    className="mt-4 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-50 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer dark:bg-zinc-700 dark:border-transparent dark:hover:bg-zinc-600 dark:text-white"
                >
                    {statusLoading ? "Salvando..." : "Salvar status"}
                </button>
            </div>
        </form>
    );
}
