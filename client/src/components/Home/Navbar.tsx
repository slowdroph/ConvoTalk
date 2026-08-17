import { useState } from "react";
import { Link } from "react-router-dom";

interface NavbarProps {
    activeSection: string;
    scrolled: boolean;
}

const NAV_LINKS = [
    { id: "recursos", label: "Recursos" },
    { id: "como-funciona", label: "Como funciona" },
    { id: "seguranca", label: "Segurança" },
];

export default function Navbar({ activeSection, scrolled }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleNavClick = () => setMenuOpen(false);

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 border-b transition-all duration-300 ${
                scrolled
                    ? "bg-background/95 backdrop-blur-md border-outline-variant/50 shadow-lg shadow-black/20"
                    : "bg-background/80 backdrop-blur-md border-outline-variant/30"
            }`}
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center px-4 h-16">
                <a href="#" className="flex items-center gap-2">
                    <img
                        src="/convo_talk_logo.png"
                        alt="ConvoTalk"
                        className="h-8 w-auto object-contain"
                    />
                    <span className="text-xl font-bold text-primary tracking-tight font-hanken">
                        ConvoTalk
                    </span>
                </a>
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.id}
                            href={`#${link.id}`}
                            className={`text-sm font-medium transition-colors ${
                                activeSection === link.id
                                    ? "text-primary"
                                    : "text-on-surface-variant hover:text-primary"
                            }`}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="hidden md:block text-on-surface hover:text-primary text-sm font-medium transition-colors"
                    >
                        Entrar
                    </Link>
                    <Link
                        to="/login?mode=register"
                        className="bg-primary-container text-on-accent px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary transition-colors"
                    >
                        Criar conta
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="md:hidden p-2 -mr-2 text-on-surface-variant hover:text-primary transition-colors"
                        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                        aria-expanded={menuOpen}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {menuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>
            {menuOpen && (
                <div className="md:hidden border-t border-outline-variant/30 bg-background/95 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={handleNavClick}
                                className={`text-sm font-medium transition-colors ${
                                    activeSection === link.id
                                        ? "text-primary"
                                        : "text-on-surface-variant hover:text-primary"
                                }`}
                            >
                                {link.label}
                            </a>
                        ))}
                        <Link
                            to="/login"
                            onClick={handleNavClick}
                            className="text-on-surface hover:text-primary text-sm font-medium transition-colors"
                        >
                            Entrar
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
