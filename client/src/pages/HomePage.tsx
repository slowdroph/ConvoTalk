import { Link } from "react-router-dom";
import PreviewChat from "../components/Home/PreviewChat";
import Navbar from "../components/Home/Navbar";
import BackToTop from "../components/Home/BackToTop";
import Reveal from "../components/ui/Reveal";
import { useScrollSpy } from "../hooks/useScrollSpy";

export default function HomePage() {
    const { activeSection, scrollY } = useScrollSpy();
    const scrolled = scrollY > 40;
    const showBackToTop = scrollY > 400;

    return (
        <div className="min-h-dvh-fallback bg-background text-on-surface font-hanken antialiased">
            <Navbar activeSection={activeSection} scrolled={scrolled} />

            {/* Hero */}
            <header className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div
                    className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"
                    style={{
                        backgroundImage:
                            "radial-gradient(#3d4a3d 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-200 h-200 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold leading-[1.15] text-on-surface mb-6 max-w-4xl mx-auto tracking-tight">
                        CONVERSE EM TEMPO REAL
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl mx-auto mb-10 text-lg md:text-xl">
                        Conecte-se instantaneamente com quem importa em uma
                        plataforma segura, rápida e intuitiva.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link
                            to="/login?mode=register"
                            className="w-full sm:w-auto bg-primary-container text-on-accent px-8 py-3 rounded-lg font-medium hover:bg-primary transition-colors text-center shadow-[0_0_20px_rgba(0,168,75,0.3)]"
                        >
                            Criar conta
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto border border-outline-variant text-on-surface px-8 py-3 rounded-lg font-medium hover:bg-surface-container-high transition-colors text-center"
                        >
                            Entrar
                        </Link>
                    </div>

                    {/* Chat Preview */}
                    <PreviewChat />
                </div>
            </header>

            {/* Recursos */}
            <section
                className="py-24 px-4 bg-surface-container-lowest relative"
                id="recursos"
            >
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <h2 className="text-2xl font-semibold text-on-surface mb-12 text-center">
                            Por que escolher o ConvoTalk?
                        </h2>
                    </Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Reveal delay={0}>
                            <div className="h-full rounded-lg border border-outline-variant bg-surface-container-high/40 backdrop-blur-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-primary"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Tempo Real
                                </h3>
                                <p className="text-sm text-on-surface-variant">
                                    Mensagens instantâneas sem atrasos. A
                                    comunicação flui na velocidade da luz.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={100}>
                            <div className="h-full rounded-lg border border-outline-variant bg-surface-container-high/40 backdrop-blur-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-primary"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Status Online
                                </h3>
                                <p className="text-sm text-on-surface-variant">
                                    Saiba instantaneamente quem está disponível
                                    para conversar na sua rede.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={200}>
                            <div className="h-full rounded-lg border border-outline-variant bg-surface-container-high/40 backdrop-blur-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-primary"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 3h18v18H3z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 8h8v2H8zM8 12h5v2H8z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Indicador de Digitação
                                </h3>
                                <p className="text-sm text-on-surface-variant">
                                    Veja em tempo real quando seus amigos estão
                                    respondendo às suas mensagens.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal delay={300}>
                            <div className="h-full rounded-lg border border-outline-variant bg-surface-container-high/40 backdrop-blur-xl p-6 hover:border-primary/50 transition-colors group">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-primary"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Notificações Inteligentes
                                </h3>
                                <p className="text-sm text-on-surface-variant">
                                    Nunca perca uma mensagem importante com
                                    nosso sistema de alertas customizáveis.
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* Como Funciona */}
            <section className="py-24 px-4" id="como-funciona">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <h2 className="text-2xl font-semibold text-on-surface mb-16 text-center">
                            Como Funciona
                        </h2>
                    </Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px bg-outline-variant -z-10" />
                        <Reveal delay={0}>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-surface-container-high border-2 border-primary rounded-full flex items-center justify-center text-primary text-2xl font-bold mb-6 relative z-10 shadow-[0_0_15px_rgba(0,168,75,0.2)]">
                                    1
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Crie sua conta
                                </h3>
                                <p className="text-sm text-on-surface-variant">
                                    Em segundos, configure seu perfil e comece a
                                    usar.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal delay={100}>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-surface-container-high border-2 border-primary rounded-full flex items-center justify-center text-primary text-2xl font-bold mb-6 relative z-10 shadow-[0_0_15px_rgba(0,168,75,0.2)]">
                                    2
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Entre em uma sala
                                </h3>
                                <p className="text-sm text-on-surface-variant">
                                    Procure um usuário específico ou junte-se a
                                    canais temáticos.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal delay={200}>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-surface-container-high border-2 border-primary rounded-full flex items-center justify-center text-primary text-2xl font-bold mb-6 relative z-10 shadow-[0_0_15px_rgba(0,168,75,0.2)]">
                                    3
                                </div>
                                <h3 className="text-lg font-bold text-on-surface mb-2">
                                    Comece a conversar
                                </h3>
                                <p className="text-sm text-on-surface-variant">
                                    Troque mensagens em tempo real sem
                                    interrupções.
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* Segurança */}
            <section
                className="py-24 px-4 bg-surface-container-lowest overflow-hidden"
                id="seguranca"
            >
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <Reveal className="flex-1 w-full">
                        <div className="flex-1">
                            <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-8 h-8 text-primary"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-on-surface mb-4">
                                Segurança e Privacidade em Primeiro Lugar
                            </h2>
                            <p className="text-on-surface-variant mb-6">
                                Acreditamos que suas conversas pertencem apenas
                                a você. Suas credenciais são protegidas e suas
                                comunicações trafegam por conexões seguras
                                (HTTPS/WSS), mantendo seus dados protegidos
                                contra acesso não autorizado.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-primary shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-on-surface">
                                        Conexão segura (HTTPS/WSS)
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-primary shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-on-surface">
                                        Nenhum dado vendido a terceiros
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-primary shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-on-surface">
                                        Servidores seguros de alta performance
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </Reveal>
                    <Reveal className="flex-1 w-full">
                        <div className="relative w-full h-100 flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px]" />
                            <div className="rounded-xl p-8 border border-primary/30 bg-surface-container-high/40 backdrop-blur-xl relative z-10 w-full max-w-md">
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-outline-variant">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-10 h-10 text-primary"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                    <div>
                                        <h4 className="text-lg text-on-surface font-bold">
                                            Status de Segurança
                                        </h4>
                                        <p className="text-xs font-semibold text-primary tracking-wider uppercase">
                                            Conexão Segura
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4 font-mono text-xs text-on-surface-variant opacity-70">
                                    <p>
                                        &gt; Estabelecendo conexão segura...
                                    </p>
                                    <p>&gt; Conectando ao servidor.</p>
                                    <p>&gt; Conexão estabelecida com sucesso.</p>
                                    <p className="text-primary">
                                        &gt; Você está conectado.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4 text-center relative">
                <Reveal>
                    <div className="max-w-3xl mx-auto rounded-2xl p-12 border border-primary/20 bg-surface-container-high/40 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent pointer-events-none" />
                        <h2 className="text-[32px] font-bold text-on-surface mb-6 relative z-10">
                            Pronto para conversar?
                        </h2>
                        <p className="text-on-surface-variant mb-8 relative z-10">
                            Junte-se a outros usuários e experimente a
                            melhor plataforma de comunicação em tempo real.
                        </p>
                        <Link
                            to="/login?mode=register"
                            className="inline-block bg-primary-container text-on-accent px-10 py-4 rounded-lg font-bold tracking-wide hover:bg-primary transition-colors shadow-[0_0_25px_rgba(0,168,75,0.4)] relative z-10"
                        >
                            Começar agora
                        </Link>
                    </div>
                </Reveal>
            </section>

            {/* Footer */}
            <footer className="w-full py-12 px-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-low border-t border-outline-variant">
                <div className="flex items-center gap-2">
                    <img
                        src="/convo_talk_logo.png"
                        alt="ConvoTalk"
                        className="h-7 w-auto object-contain"
                    />
                    <span className="text-xl text-on-surface font-bold">
                        ConvoTalk
                    </span>
                </div>
                <div className="flex gap-6">
                    <Link
                        to="/privacy"
                        className="text-on-surface-variant hover:text-on-surface transition-colors text-xs font-semibold"
                    >
                        Privacidade
                    </Link>
                    <Link
                        to="/terms"
                        className="text-on-surface-variant hover:text-on-surface transition-colors text-xs font-semibold"
                    >
                        Termos
                    </Link>
                </div>
                <p className="text-sm text-on-surface-variant">
                    © {new Date().getFullYear()} ConvoTalk. Todos os direitos
                    reservados.
                </p>
            </footer>

            <BackToTop visible={showBackToTop} />
        </div>
    );
}
