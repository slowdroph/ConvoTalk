import { useState } from "react";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";

export default function PasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (newPassword.length < 8) {
            setError("A nova senha deve ter pelo menos 8 caracteres.");
            return;
        }

        setLoading(true);

        try {
            await api.put("/user/password", { currentPassword, newPassword });
            setSuccess("Senha alterada com sucesso!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao alterar senha"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-noir-border pb-4">
                <h2 className="text-base font-semibold text-noir-text-bright">
                    Alterar Senha
                </h2>
                <p className="text-xs text-noir-text-muted mt-0.5">
                    Mantenha sua conta protegida usando uma combinação forte de caracteres.
                </p>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                <div>
                    <label
                        htmlFor="currentPassword"
                        className="block text-xs font-medium text-noir-text-bright mb-1.5"
                    >
                        Senha atual
                    </label>
                    <div className="relative">
                        <input
                            type={showCurrent ? "text" : "password"}
                            name="currentPassword"
                            id="currentPassword"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            maxLength={128}
                            className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright pr-10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent((prev) => !prev)}
                            className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                            title={showCurrent ? "Ocultar senha" : "Exibir senha"}
                        >
                            {showCurrent ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="newPassword"
                        className="block text-xs font-medium text-noir-text-bright mb-1.5"
                    >
                        Nova senha
                    </label>
                    <div className="relative">
                        <input
                            type={showNew ? "text" : "password"}
                            name="newPassword"
                            id="newPassword"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            maxLength={128}
                            className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright pr-10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew((prev) => !prev)}
                            className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                            title={showNew ? "Ocultar senha" : "Exibir senha"}
                        >
                            {showNew ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-xs font-medium text-noir-text-bright mb-1.5"
                    >
                        Confirmar nova senha
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirm ? "text" : "password"}
                            name="confirmPassword"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            maxLength={128}
                            className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright pr-10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((prev) => !prev)}
                            className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                            title={showConfirm ? "Ocultar senha" : "Exibir senha"}
                        >
                            {showConfirm ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs tracking-wide shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? "Alterando..." : "Alterar senha"}
                    </button>
                </div>
            </form>
        </div>
    );
}

