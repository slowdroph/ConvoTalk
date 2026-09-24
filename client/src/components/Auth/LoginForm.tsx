import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/errors";
import api from "../../services/api";
import AuthSubmitButton from "./AuthSubmitButton";

export default function LoginForm() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [needsVerification, setNeedsVerification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setNeedsVerification(false);
        setResendMessage("");
        setLoading(true);

        try {
            await login(email, password);
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: {
                    status?: number;
                    data?: {
                        error?: {
                            code?: string;
                            message?: string;
                            details?: { needsVerification?: boolean };
                        };
                        message?: string;
                    };
                };
            };
            const errorData = axiosErr?.response?.data;
            const needsVerification =
                axiosErr?.response?.status === 403 &&
                (errorData?.error?.details?.needsVerification === true ||
                    errorData?.error?.code === "EMAIL_NOT_VERIFIED");
            if (needsVerification) {
                setNeedsVerification(true);
                setError(errorData?.error?.message || "Verifique seu email.");
            } else {
                setError(getErrorMessage(err, "Erro ao fazer login"));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setResendMessage("");
        try {
            await api.post("/auth/resend-verification", { email });
            setResendMessage(
                "Email reenviado! Verifique sua caixa de entrada.",
            );
        } catch (err: unknown) {
            setResendMessage(getErrorMessage(err, "Erro ao reenviar email"));
        } finally {
            setResending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" method="POST">
            {error && !needsVerification && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {needsVerification && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-xl text-sm space-y-2">
                    <p>{error}</p>
                    {resendMessage && (
                        <p
                            className={
                                resendMessage.includes("Erro")
                                    ? "text-red-400"
                                    : "text-green-400"
                            }
                        >
                            {resendMessage}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="text-sm text-green-400 hover:text-green-300 transition-colors underline"
                    >
                        {resending
                            ? "Reenviando..."
                            : "Reenviar email de verificação"}
                    </button>
                </div>
            )}

            <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-zinc-300">
                    E-mail
                </label>
                <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        aria-label="Email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setNeedsVerification(false);
                            setError("");
                        }}
                        required
                        maxLength={100}
                        className="w-full rounded-xl bg-[#131c13]/90 border border-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-150"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-zinc-300">
                    Senha
                </label>
                <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        aria-label="Senha"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setNeedsVerification(false);
                            setError("");
                        }}
                        required
                        maxLength={128}
                        className="w-full rounded-xl bg-[#131c13]/90 border border-white/10 pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-150"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        className={`absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors focus:outline-none ${showPassword ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex items-center pt-1 justify-end">
                <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors focus:outline-none focus:underline"
                >
                    Esqueceu a senha?
                </Link>
            </div>

            <div className="pt-2">
                <AuthSubmitButton
                    loading={loading}
                    label="Entrar"
                    loadingLabel="Entrando..."
                />
            </div>
        </form>
    );
}
