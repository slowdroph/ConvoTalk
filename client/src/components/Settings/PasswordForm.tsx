import { useState } from "react";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";

export default function PasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Alterar Senha
            </h3>

            {success && (
                <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm dark:bg-green-500/10 dark:border-green-500/50 dark:text-green-400">
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-400">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="currentPassword" className="block text-sm text-slate-600 mb-1 dark:text-zinc-400">
                    Senha atual
                </label>
                <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    maxLength={128}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-green-500"
                />
            </div>

            <div>
                <label htmlFor="newPassword" className="block text-sm text-slate-600 mb-1 dark:text-zinc-400">
                    Nova senha
                </label>
                <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-green-500"
                />
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm text-slate-600 mb-1 dark:text-zinc-400">
                    Confirmar nova senha
                </label>
                <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-green-500"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors cursor-pointer dark:bg-green-600 dark:hover:bg-green-700 dark:text-on-accent"
            >
                {loading ? "Alterando..." : "Alterar senha"}
            </button>
        </form>
    );
}
