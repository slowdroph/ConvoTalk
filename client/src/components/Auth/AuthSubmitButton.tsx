import type { ButtonHTMLAttributes } from "react";

interface AuthSubmitButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    loading: boolean;
    label: string;
    loadingLabel: string;
}

export default function AuthSubmitButton({
    loading,
    disabled,
    label,
    loadingLabel,
    type = "submit",
    className = "",
    ...props
}: AuthSubmitButtonProps) {
    const isDisabled = disabled || loading;
    return (
        <button
            type={type}
            disabled={isDisabled}
            aria-busy={loading}
            aria-disabled={isDisabled}
            {...props}
            className={`w-full py-3 px-4 rounded-xl bg-[#00a84b] text-white font-semibold text-sm flex items-center justify-center gap-2 select-none touch-manipulation outline-none [-webkit-tap-highlight-color:transparent] shadow-lg shadow-emerald-950/60 transition-[background-color,box-shadow,transform,border-color] duration-150 hover:bg-emerald-500 hover:shadow-emerald-900/50 active:bg-[#009141] active:shadow-none active:brightness-95 motion-safe:active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-[#00a84b] disabled:hover:shadow-lg disabled:hover:shadow-emerald-950/60 disabled:active:scale-100 disabled:active:brightness-100 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-0 focus-visible:border-emerald-300/60 ${className}`.trim()}
        >
            {loading ? (
                <>
                    <span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                    />
                    <span>{loadingLabel}</span>
                </>
            ) : (
                <>
                    <span>{label}</span>
                    <svg
                        aria-hidden="true"
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </>
            )}
        </button>
    );
}
