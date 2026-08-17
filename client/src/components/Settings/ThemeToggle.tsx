import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2 dark:text-white">Aparência</h3>
      <div className="flex items-center justify-between gap-4 py-3">
        <div>
          <p className="text-slate-600 text-sm dark:text-zinc-400">
            {theme === "dark" ? "Modo escuro" : "Modo claro"}
          </p>
          <p className="text-slate-500 text-xs mt-0.5 dark:text-zinc-500">
            {theme === "dark"
              ? "Economiza bateria e reduz brilho."
              : "Ideal para ambientes bem iluminados."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={theme === "light"}
          onClick={toggleTheme}
          className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
            theme === "light" ? "bg-emerald-600 dark:bg-green-600" : "bg-slate-300 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`absolute left-0 top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              theme === "light" ? "translate-x-[24px]" : "translate-x-[2px]"
            }`}
          />
        </button>
      </div>
    </div>
  );
}