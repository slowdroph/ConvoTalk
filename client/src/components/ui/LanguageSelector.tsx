import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { LANGUAGE_OPTIONS } from "@shared/i18n";
import { useLanguage } from "../../hooks/useLanguage";
import {
    isLocalizablePath,
    localizePath,
    stripLocale,
} from "../../i18n/routing";
import DropdownMenu from "./DropdownMenu";
import CountryFlag from "./CountryFlag";

interface LanguageSelectorProps {
    tone?: "default" | "dark" | "header";
    align?: "left" | "right";
    className?: string;
    id?: string;
}

export default function LanguageSelector({
    tone = "default",
    align = "right",
    className = "",
    id,
}: LanguageSelectorProps) {
    const { t } = useTranslation("common");
    const { language, isSyncing, setLanguage } = useLanguage();
    const navigate = useNavigate();
    const { pathname, search } = useLocation();
    const current =
        LANGUAGE_OPTIONS.find((option) => option.code === language) ??
        LANGUAGE_OPTIONS[0];

    const triggerClass =
        tone === "dark"
            ? "flex items-center gap-2 rounded-full border border-emerald-500/20 bg-[#131c13]/80 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-md transition-colors hover:border-emerald-500/40 hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:opacity-60"
            : tone === "header"
              ? "inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high/60 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
              : "flex w-full items-center justify-between gap-2 rounded-xl border border-noir-border bg-noir-surface px-3.5 py-2.5 text-sm text-noir-text-bright transition-colors hover:border-noir-border-light focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-60";

    const itemClass = (active: boolean) =>
        `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
            active
                ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-300"
                : "text-noir-text-bright hover:bg-slate-200/80 dark:hover:bg-noir-card"
        }`;

    return (
        <DropdownMenu
            align={align}
            className={className}
            trigger={({ onClick, ...props }) => (
                <button
                    type="button"
                    id={id}
                    onClick={onClick}
                    disabled={isSyncing}
                    aria-label={t("language.select")}
                    title={tone === "header" ? current.nativeName : undefined}
                    aria-busy={isSyncing}
                    {...props}
                    className={triggerClass}
                >
                    <span
                        className={`flex min-w-0 items-center ${
                            tone === "header" ? "gap-1.5" : "gap-2"
                        }`}
                    >
                        <svg
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-18c2.5 2.4 3.9 5.5 3.9 9s-1.4 6.6-3.9 9m0-18C9.5 5.4 8.1 8.5 8.1 12s1.4 6.6 3.9 9M3.5 9h17M3.5 15h17"
                            />
                        </svg>
                        <CountryFlag
                            country={current.flag}
                            name={current.nativeName}
                            className="h-3.5 w-5"
                        />
                        {tone !== "header" && (
                            <span className="truncate">
                                {current.nativeName}
                            </span>
                        )}
                    </span>
                    {tone === "header" ? (
                        isSyncing ? (
                            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : null
                    ) : (
                        <svg
                            aria-hidden="true"
                            className={`h-3.5 w-3.5 shrink-0 transition-transform ${isSyncing ? "animate-spin" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            {isSyncing ? (
                                <path
                                    strokeLinecap="round"
                                    d="M12 3a9 9 0 109 9"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 9l-7 7-7-7"
                                />
                            )}
                        </svg>
                    )}
                </button>
            )}
        >
            <div className="flex flex-col gap-0.5">
                {LANGUAGE_OPTIONS.map((option) => {
                    const active = option.code === language;
                    return (
                        <button
                            key={option.code}
                            type="button"
                            role="menuitemradio"
                            aria-checked={active}
                            lang={option.code}
                            onClick={() => {
                                if (active) return;
                                // Public pages carry the language in the URL.
                                if (isLocalizablePath(pathname)) {
                                    navigate(
                                        `${localizePath(
                                            option.code,
                                            stripLocale(pathname),
                                        )}${search}`,
                                    );
                                    return;
                                }
                                void setLanguage(option.code);
                            }}
                            className={itemClass(active)}
                        >
                            <CountryFlag
                                country={option.flag}
                                name={option.nativeName}
                                className="h-3.5 w-5"
                            />
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate font-medium">
                                    {option.nativeName}
                                </span>
                                <span className="truncate text-[11px] text-noir-text-muted">
                                    {option.englishName}
                                </span>
                            </span>
                            {active && (
                                <svg
                                    aria-hidden="true"
                                    className="ml-auto h-4 w-4 shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            )}
                        </button>
                    );
                })}
            </div>
        </DropdownMenu>
    );
}
