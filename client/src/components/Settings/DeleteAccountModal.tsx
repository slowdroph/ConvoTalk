import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/errors";
import Button from "../ui/Button";

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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-xl dark:bg-zinc-900 dark:border-zinc-700">
                <h3 className="text-lg font-semibold text-red-600 mb-2 dark:text-red-400">
                    Excluir conta
                </h3>
                <p className="text-slate-500 text-sm mb-4 dark:text-zinc-400">
                    Esta ação é irreversível. Todas as suas mensagens serão
                    excluídas. Digite sua senha para confirmar.
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4 dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleDelete} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        maxLength={128}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500"
                    />

                    <div className="flex gap-3">
                        <Button
                            variant="secondaryLight"
                            className="flex-1"
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? "Excluindo..." : "Excluir conta"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
