import { useTranslation } from "react-i18next";

interface InlineEditButtonProps {
    label: string;
    onClick: () => void;
    expanded?: boolean;
}

export default function InlineEditButton({
    label,
    onClick,
    expanded = false,
}: InlineEditButtonProps) {
    const { t } = useTranslation("profile");

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 transition-colors hover:underline dark:text-emerald-400"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
            </svg>
            {t("inline.edit")}
        </button>
    );
}
