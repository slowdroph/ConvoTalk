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
    { id: "arquitetura", label: "Arquitetura" },
];

export default function Navbar({ activeSection, scrolled }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleNavClick = () => setMenuOpen(false);

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 border-b transition-all duration-300 ${
                scrolled
                    ? "glass-card border-outline-variant/60 bg-[#0e150e]/90 shadow-lg shadow-black/30"
                    : "glass-card border-outline-variant/40 bg-[#0e150e]/75"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand */}
                <a href="#" className="flex items-center gap-2 group">
                    <img
                        src="/convo_talk_logo.png"
                        alt="ConvoTalk"
                        className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
                    />
                    <span className="text-xl font-bold text-primary tracking-tight font-hanken">
                        ConvoTalk
                    </span>
                </a>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-7">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.id}
                            href={`#${link.id}`}
                            className={`text-sm font-medium transition-colors ${
                                activeSection === link.id
                                    ? "text-primary font-semibold"
                                    : "text-on-surface-variant hover:text-primary"
                            }`}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="text-sm font-medium text-on-surface-variant hover:text-on-surface px-3 py-1.5 transition-colors"
                    >
                        Entrar
                    </Link>
                    <Link
                        to="/login?mode=register"
                        className="inline-flex items-center gap-1.5 bg-primary-container text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary hover:text-on-primary-container transition-all shadow-[0_0_15px_rgba(0,168,75,0.25)] hover:shadow-[0_0_20px_rgba(89,224,123,0.4)]"
                    >
                        Criar conta
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="md:hidden p-2 -mr-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
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

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="md:hidden border-t border-outline-variant/40 bg-[#0e150e]/95 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={handleNavClick}
                                className={`text-sm font-medium py-1 transition-colors ${
                                    activeSection === link.id
                                        ? "text-primary font-semibold"
                                        : "text-on-surface-variant hover:text-primary"
                                }`}
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                            <Link
                                to="/login"
                                onClick={handleNavClick}
                                className="text-on-surface hover:text-primary text-sm font-medium transition-colors"
                            >
                                Entrar
                            </Link>
                            <Link
                                to="/login?mode=register"
                                onClick={handleNavClick}
                                className="bg-primary-container text-white text-xs font-semibold px-3.5 py-2 rounded-lg"
                            >
                                Criar conta
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

