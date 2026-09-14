import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
}: DeleteAccountModalProps) {
    const { logout } = useAuth();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.delete("/user/account", { data: { password } });
            logout();
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao excluir conta"));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPassword("");
        setError("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-noir-card border border-red-900/40 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl space-y-4">
                <div className="flex items-center gap-2.5 text-red-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-base font-semibold text-red-400">
                        Excluir conta definitivamente
                    </h3>
                </div>

                <p className="text-xs text-noir-text-muted leading-relaxed">
                    Esta ação é irreversível. Todas as suas conversas, mensagens e mídias serão excluídas permanentemente dos servidores. Digite sua senha para confirmar.
                </p>

                {error && (
                    <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleDelete} className="space-y-4 pt-1">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-medium text-noir-text-bright mb-1.5"
                        >
                            Sua senha atual
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            autoComplete="current-password"
                            placeholder="Digite sua senha para confirmar"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            maxLength={128}
                            className="w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright placeholder-noir-text-muted focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-noir-surface-alt hover:bg-noir-card text-xs font-medium text-noir-text-bright border border-noir-border-light transition cursor-pointer"
                            onClick={handleClose}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-red-800/80 bg-red-950/60 hover:bg-red-900/70 text-red-300 font-semibold text-xs transition duration-150 cursor-pointer disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? "Excluindo..." : "Excluir conta"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
