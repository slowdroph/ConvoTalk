import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import { getErrorMessage } from "../utils/errors";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("As senhas não coincidem.");
            return;
        }

        if (!token) {
            setStatus("error");
            setMessage("Token de redefinição não encontrado.");
            return;
        }

        try {
            const { data } = await api.post("/auth/reset-password", {
                token,
                password,
            });
            setStatus("success");
            setMessage(data.message);
        } catch (err: unknown) {
            setStatus("error");
            setMessage(getErrorMessage(err, "Erro ao redefinir a senha."));
        }
    };

    return (
        <div className="min-h-dvh-fallback bg-zinc-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img
                        src="/convo_talk_logo.png"
                        alt="ConvoTalk"
                        className="h-20 w-auto mx-auto mb-4 object-contain"
                    />
                    <h1 className="text-2xl font-bold text-white">ConvoTalk</h1>
                    <p className="text-zinc-500 mt-1">Nova senha</p>
                </div>

                <div className="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
                    {status === "success" ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-on-accent"
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
                            </div>
                            <p className="text-zinc-300 text-sm">{message}</p>
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-on-accent font-medium rounded-lg transition-colors text-sm"
                            >
                                Ir para o login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-zinc-400 text-sm">
                                Defina uma nova senha para sua conta.
                            </p>

                            {status === "error" && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                                    {message}
                                </div>
                            )}

                            <input
                                type="password"
                                placeholder="Nova senha"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setStatus("idle");
                                    setMessage("");
                                }}
                                required
                                minLength={8}
                                maxLength={128}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                            />

                            <input
                                type="password"
                                placeholder="Confirmar nova senha"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setStatus("idle");
                                    setMessage("");
                                }}
                                required
                                minLength={8}
                                maxLength={128}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
                            />

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                            >
                                {status === "loading"
                                    ? "Redefinindo..."
                                    : "Redefinir senha"}
                            </button>

                            <Link
                                to="/login"
                                className="block text-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                Voltar para o login
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
