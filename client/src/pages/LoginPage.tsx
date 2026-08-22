import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import LoginForm from "../components/Auth/LoginForm";
import RegisterForm from "../components/Auth/RegisterForm";
import ChatIllustration from "../components/ui/ChatIllustration";

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(() => {
        return searchParams.get("mode") !== "register";
    });

    const switchToLogin = useCallback(() => setIsLogin(true), []);

    return (
        <div className="min-h-dvh-fallback bg-zinc-950 lg:grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col justify-between relative overflow-hidden p-10 bg-background">
                <div
                    className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"
                    style={{
                        backgroundImage:
                            "radial-gradient(#3d4a3d 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-175 h-175 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-glowPulse" />

                <div className="relative z-10 animate-fadeInUp">
                    <div className="flex items-center gap-3">
                        <img
                            src="/convo_talk_logo.png"
                            alt="ConvoTalk"
                            className="h-12 w-auto object-contain"
                        />
                        <span className="text-xl font-bold text-on-surface">
                            ConvoTalk
                        </span>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="animate-fadeInUp animation-delay-200">
                        <h2 className="text-3xl font-bold text-on-surface leading-tight mb-3">
                            Converse em tempo real,
                            <br />
                            <span className="text-green-400">
                                de qualquer lugar.
                            </span>
                        </h2>
                        <p className="text-on-surface-variant max-w-md">
                            Uma plataforma segura, rápida e intuitiva para você
                            se conectar com quem importa.
                        </p>
                    </div>

                    <div className="mt-10 animate-fadeInUp animation-delay-300">
                        <ChatIllustration />
                    </div>
                </div>

                <p className="relative z-10 text-xs text-on-surface-variant/70">
                    © {new Date().getFullYear()} ConvoTalk — Feito com segurança
                    e privacidade.
                </p>
            </div>

            <div className="flex items-center justify-center px-4 py-10 min-h-dvh-fallback lg:min-h-0 relative">
                <div
                    className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none lg:hidden"
                    style={{
                        backgroundImage:
                            "radial-gradient(#3d4a3d 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <div className="w-full max-w-md relative z-10">
                    <div className="text-center mb-8 lg:hidden animate-fadeInUp">
                        <img
                            src="/convo_talk_logo.png"
                            alt="ConvoTalk"
                            className="h-20 w-auto mx-auto mb-4 object-contain"
                        />
                        <h1 className="text-2xl font-bold text-white">
                            ConvoTalk
                        </h1>
                        <p className="text-zinc-500 mt-1">
                            Converse em tempo real
                        </p>
                    </div>

                    <div className="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800 animate-fadeInUp animation-delay-100">
                        <div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isLogin
                                        ? "bg-green-600 text-on-accent"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                                    !isLogin
                                        ? "bg-green-600 text-on-accent"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                Criar conta
                            </button>
                        </div>

                        <div
                            key={isLogin ? "login" : "register"}
                            className="animate-slideInRight"
                        >
                            {isLogin ? (
                                <LoginForm />
                            ) : (
                                <RegisterForm onSwitchToLogin={switchToLogin} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
