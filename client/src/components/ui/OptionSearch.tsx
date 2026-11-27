import { useTranslation } from "react-i18next";

interface OptionSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    id?: string;
}

const DEFAULT_CLASS =
    "w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70";

export default function OptionSearch({
    value,
    onChange,
    placeholder,
    label,
    className = DEFAULT_CLASS,
    id,
}: OptionSearchProps) {
    const { t } = useTranslation("common");

    return (
        <div className="relative">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-noir-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                />
            </svg>
            <input
                id={id}
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder ?? t("optionSearch.placeholder")}
                aria-label={label ?? t("optionSearch.label")}
                className={className}
            />
        </div>
    );
}
