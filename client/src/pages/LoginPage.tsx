import { useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoginForm from "../components/Auth/LoginForm";
import RegisterForm from "../components/Auth/RegisterForm";
import AuthTabs from "../components/Auth/AuthTabs";
import ChatMockup from "../components/ui/ChatMockup";
import SEO from "../components/SEO";

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(() => {
        return searchParams.get("mode") !== "register";
    });

    const switchToLogin = useCallback(() => setIsLogin(true), []);

    return (
        <div className="login-dark min-h-dvh-fallback text-zinc-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
            <SEO
                title="Login"
                description="Entre na sua conta ConvoTalk ou crie uma nova conta gratuita. Converse em tempo real com quem importa."
                canonical="/login"
            />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 login-dot-matrix opacity-70" />
                <div className="absolute inset-0 login-radial-glow" />
                <div className="absolute inset-0 login-radial-glow-right" />
            </div>

            <header className="relative z-10 w-full px-6 py-6 lg:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                        <img
                            src="/convo_talk_logo.png"
                            alt="ConvoTalk"
                            className="h-9 w-auto object-contain"
                        />
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold tracking-tight text-white">
                                Convo<span className="text-emerald-400 font-extrabold">Talk</span>
                            </span>
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                    </Link>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#131c13]/80 border border-emerald-500/20 text-xs font-medium text-emerald-300 backdrop-blur-md">
                        <span className="relative flex w-2 h-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span>Rede Operacional Conectada</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 grow flex items-center justify-center px-4 py-8 lg:px-12">
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    <section aria-label="Apresentação do Produto" className="lg:col-span-7 flex flex-col justify-center space-y-8">
                        <div className="space-y-4 max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                                Nova versão 2.0 lançada
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                                Converse em tempo real,
                                <br />
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-emerald-300">
                                    de qualquer lugar.
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
                                Uma plataforma segura, rápida e intuitiva para você conectar suas equipes e clientes em tempo real.
                            </p>
                        </div>
                        <div className="animate-fadeInUp animation-delay-300">
                            <ChatMockup />
                        </div>
                    </section>

                    <section aria-label="Formulário de Acesso" className="lg:col-span-5 flex justify-center w-full">
                        <div className="w-full max-w-md bg-[#0e150e]/95 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/90 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30">
                            <AuthTabs isLogin={isLogin} onChange={setIsLogin} />

                            <div className="mb-6 space-y-1.5">
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
                                </h2>
                                <p className="text-xs sm:text-sm text-zinc-400">
                                    {isLogin
                                        ? "Insira suas credenciais para acessar sua conta"
                                        : "Comece gratuitamente em segundos"}
                                </p>
                            </div>

                            <div key={isLogin ? "login" : "register"} className="animate-slideInRight">
                                {isLogin ? (
                                    <LoginForm />
                                ) : (
                                    <RegisterForm onSwitchToLogin={switchToLogin} />
                                )}
                            </div>

                            <div className="mt-6 pt-5 border-t border-white/5 text-center">
                                <p className="text-xs text-zinc-400">
                                    {isLogin ? (
                                        <>
                                            Não tem uma conta?{" "}
                                            <button
                                                onClick={() => setIsLogin(false)}
                                                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                                            >
                                                Cadastre-se gratuitamente
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            Já tem uma conta?{" "}
                                            <button
                                                onClick={() => setIsLogin(true)}
                                                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                                            >
                                                Entrar
                                            </button>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="relative z-10 w-full px-6 py-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <p>© 2026 ConvoTalk — Feito com segurança e privacidade.</p>
                    <div className="flex items-center gap-6">
                        <Link className="hover:text-zinc-300 transition-colors" to="/privacy">
                            Privacidade
                        </Link>
                        <Link className="hover:text-zinc-300 transition-colors" to="/terms">
                            Termos de Uso
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
