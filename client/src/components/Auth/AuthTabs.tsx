import { useRef } from "react";

interface AuthTabsProps {
    isLogin: boolean;
    onChange: (isLogin: boolean) => void;
}

const tabButtonClasses =
    "relative z-10 w-1/2 py-2 px-3 text-xs sm:text-sm rounded-lg outline-none [-webkit-tap-highlight-color:transparent] select-none touch-manipulation transition-[color,background-color] duration-150 focus-visible:ring-1 focus-visible:ring-emerald-300/70 focus-visible:ring-inset cursor-pointer";

export default function AuthTabs({ isLogin, onChange }: AuthTabsProps) {
    const loginRef = useRef<HTMLButtonElement>(null);
    const registerRef = useRef<HTMLButtonElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const nextIsLogin = e.key === "ArrowLeft";
        onChange(nextIsLogin);
        (nextIsLogin ? loginRef : registerRef).current?.focus();
    };

    return (
        <div
            role="tablist"
            aria-label="Alternar entre entrar e criar conta"
            onKeyDown={handleKeyDown}
            className="relative p-1 bg-black/40 border border-white/5 rounded-xl flex items-center mb-7"
        >
            <span
                aria-hidden="true"
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-zinc-800/90 border border-white/10 shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${isLogin ? "translate-x-0" : "translate-x-full"}`}
            />
            <button
                ref={loginRef}
                role="tab"
                type="button"
                aria-selected={isLogin}
                tabIndex={isLogin ? 0 : -1}
                onClick={() => onChange(true)}
                className={`${tabButtonClasses} ${isLogin ? "font-semibold text-white" : "font-medium text-zinc-400 hover:text-zinc-200"}`}
            >
                Entrar
            </button>
            <button
                ref={registerRef}
                role="tab"
                type="button"
                aria-selected={!isLogin}
                tabIndex={!isLogin ? 0 : -1}
                onClick={() => onChange(false)}
                className={`${tabButtonClasses} ${!isLogin ? "font-semibold text-white" : "font-medium text-zinc-400 hover:text-zinc-200"}`}
            >
                Criar conta
            </button>
        </div>
    );
}
