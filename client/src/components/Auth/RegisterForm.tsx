import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/errors";
import { reportSignupConversion } from "../../lib/ads";
import api from "../../services/api";
import AuthSubmitButton from "./AuthSubmitButton";

interface RegisterFormProps {
    onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await register(name, email, password);
            reportSignupConversion();
            setRegisteredEmail(email);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Erro ao criar conta"));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!registeredEmail) return;
        setResending(true);
        setResendMessage("");
        try {
            await api.post("/auth/resend-verification", {
                email: registeredEmail,
            });
            setResendMessage(
                "Email reenviado! Verifique sua caixa de entrada.",
            );
        } catch (err: unknown) {
            setResendMessage(getErrorMessage(err, "Erro ao reenviar email"));
        } finally {
            setResending(false);
        }
    };

    if (registeredEmail) {
        return (
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#00a84b] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/60">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <h2 className="text-white text-lg font-semibold">
                    Verifique seu email
                </h2>
                <p className="text-zinc-400 text-sm">
                    Se o email for válido, enviamos um link de confirmação para{" "}
                    <span className="text-white font-medium">
                        {registeredEmail}
                    </span>
                </p>
                <p className="text-zinc-500 text-xs">
                    Clique no link no email para ativar sua conta.
                </p>

                {resendMessage && (
                    <div
                        className={`text-sm px-4 py-2 rounded-xl ${
                            resendMessage.includes("Erro")
                                ? "bg-red-500/10 border border-red-500/50 text-red-400"
                                : "bg-green-500/10 border border-green-500/50 text-green-400"
                        }`}
                    >
                        {resendMessage}
                    </div>
                )}

                <button
                    type="button" onClick={handleResend}
                    disabled={resending}
                    className="w-full py-3 bg-zinc-800/90 hover:bg-zinc-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm border border-white/10"
                >
                    {resending ? "Reenviando..." : "Reenviar email"}
                </button>

                <button
                    type="button" onClick={onSwitchToLogin}
                    className="w-full py-3 px-4 bg-[#00a84b] hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                    Ir para o login
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4" method="POST">
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-semibold text-zinc-300">
                    Nome
                </label>
                <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        autoComplete="name"
                        placeholder="Seu nome"
                        aria-label="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={50}
                        className="w-full rounded-xl bg-[#131c13]/90 border border-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-150"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="register-email" className="block text-xs font-semibold text-zinc-300">
                    E-mail
                </label>
                <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <input
                        type="email"
                        name="email"
                        id="register-email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        aria-label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full rounded-xl bg-[#131c13]/90 border border-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition duration-150"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="register-password" className="block text-xs font-semibold text-zinc-300">
                    Senha
                </label>
                <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="register-password"
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        aria-label="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
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

            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input
                    type="checkbox"
                    name="acceptedTerms"
                    id="acceptedTerms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/10 bg-[#131c13] text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                />
                <span className="text-zinc-400 text-xs leading-relaxed">
                    Li e aceito os{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                        Termos de Uso
                    </a>{" "}
                    e a{" "}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                        Política de Privacidade
                    </a>
                    .
                </span>
            </label>

            <div className="pt-2">
                <AuthSubmitButton
                    loading={loading}
                    disabled={!acceptedTerms}
                    label="Criar conta"
                    loadingLabel="Criando conta..."
                />
            </div>
        </form>
    );
}
