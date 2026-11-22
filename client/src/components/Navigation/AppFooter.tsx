import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface AppFooterProps {
    className?: string;
}

export default function AppFooter({ className = "" }: AppFooterProps) {
    const { t } = useTranslation("common");

    return (
        <footer
            className={`space-y-1.5 px-2 text-xs text-slate-500 dark:text-noir-text-muted ${className}`}
        >
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link
                    to="/privacy"
                    className="transition-colors hover:text-slate-700 dark:hover:text-slate-300"
                >
                    {t("footer.privacy")}
                </Link>
                <Link
                    to="/terms"
                    className="transition-colors hover:text-slate-700 dark:hover:text-slate-300"
                >
                    {t("footer.terms")}
                </Link>
            </div>
            <p className="font-mono text-[11px] text-slate-400 dark:text-noir-text-muted/70">
                {t("footer.rights", { year: new Date().getFullYear() })}
            </p>
        </footer>
    );
}
