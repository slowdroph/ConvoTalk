import { Link } from "react-router-dom";

interface LegalLayoutProps {
    title: string;
    lastUpdated?: string;
    children: React.ReactNode;
}

export default function LegalLayout({
    title,
    lastUpdated,
    children,
}: LegalLayoutProps) {
    return (
        <div className="bg-background text-on-surface font-hanken antialiased flex flex-col min-h-dvh-fallback">
            <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 border-b border-surface-container-high bg-background">
                <Link to="/" className="flex items-center gap-2">
                    <img
                        src="/convo_talk_logo.png"
                        alt="ConvoTalk"
                        className="h-8 w-auto object-contain"
                    />
                    <span className="text-xl font-bold text-primary tracking-tight font-hanken">
                        ConvoTalk
                    </span>
                </Link>
                <nav className="hidden md:flex items-center gap-8">
                    <Link
                        to="/#recursos"
                        className="text-[13px] leading-4.5 tracking-[0.02em] font-medium text-on-surface-variant hover:text-primary transition-colors duration-200"
                    >
                        Recursos
                    </Link>
                    <Link
                        to="/#como-funciona"
                        className="text-[13px] leading-4.5 tracking-[0.02em] font-medium text-on-surface-variant hover:text-primary transition-colors duration-200"
                    >
                        Como funciona
                    </Link>
                    <Link
                        to="/#seguranca"
                        className="text-[13px] leading-4.5 tracking-[0.02em] font-medium text-on-surface-variant hover:text-primary transition-colors duration-200"
                    >
                        Segurança
                    </Link>
                </nav>
                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="text-[13px] leading-4.5 tracking-[0.02em] font-medium text-on-surface-variant hover:text-primary transition-colors duration-200 px-3 py-2"
                    >
                        Login
                    </Link>
                    <Link
                        to="/login?mode=register"
                        className="text-[13px] leading-4.5 tracking-[0.02em] font-medium bg-primary-container text-white rounded px-4 py-2 hover:opacity-90 transition-opacity"
                    >
                        Criar conta
                    </Link>
                </div>
            </header>

            <main className="grow pt-32 pb-24 px-4">
                <article className="max-w-3xl mx-auto">
                    <header className="mb-12 border-b border-outline-variant pb-8">
                        <h1 className="text-2xl md:text-3xl leading-8 md:leading-9 font-bold text-primary mb-1">
                            {title}
                        </h1>
                        {lastUpdated && (
                            <p className="text-[13px] leading-4.5 tracking-[0.02em] font-medium text-on-surface-variant">
                                Última atualização: {lastUpdated}
                            </p>
                        )}
                    </header>
                    {children}
                </article>
            </main>

            <footer className="bg-surface-container-low w-full py-12 px-4 border-t border-outline-variant">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <span className="text-xl leading-7 font-semibold text-on-surface font-hanken">
                            ConvoTalk
                        </span>
                        <span className="text-sm leading-5 text-on-surface-variant">
                            © {new Date().getFullYear()} ConvoTalk. Todos os
                            direitos reservados.
                        </span>
                    </div>
                    <nav className="flex flex-wrap justify-center gap-6">
                        <Link
                            to="/privacy"
                            className="text-[11px] leading-4 tracking-wider text-primary font-bold hover:text-on-surface transition-colors"
                        >
                            Privacidade
                        </Link>
                        <Link
                            to="/terms"
                            className="text-[11px] leading-4 tracking-wider font-semibold text-primary hover:text-on-surface transition-colors"
                        >
                            Termos
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
