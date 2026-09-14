import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div className="space-y-6">
            <div className="border-b border-noir-border pb-4">
                <h2 className="text-base font-semibold text-noir-text-bright">Aparência</h2>
                <p className="text-xs text-noir-text-muted mt-0.5">
                    Ajuste o tema visual da sua interface de chat.
                </p>
            </div>

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-noir-text-bright">
                            Modo escuro
                        </h3>
                        <p className="text-xs text-noir-text-muted mt-0.5">
                            {isDark
                                ? "Economiza bateria e reduz brilho."
                                : "Interface clara para ambientes bem iluminados."}
                        </p>
                    </div>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={isDark}
                        onClick={toggleTheme}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                            isDark ? "bg-emerald-500" : "bg-noir-border-light"
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isDark ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

