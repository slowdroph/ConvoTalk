import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    datePartsFromIso,
    type DateParts,
} from "../../utils/date";

interface DateOfBirthInputProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string | null;
    className?: string;
    required?: boolean;
}

const DEFAULT_CLASS =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright";

const SEGMENT_CLASS =
    "min-w-0 bg-transparent text-center outline-none placeholder:text-slate-400 dark:placeholder:text-noir-text-muted/70";

function isoFromParts({ day, month, year }: DateParts): string {
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return "";
    return `${year}-${month}-${day}`;
}

function parsePastedDate(text: string): DateParts | null {
    const trimmed = text.trim();
    const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(trimmed);
    if (iso) {
        return {
            year: iso[1],
            month: iso[2].padStart(2, "0"),
            day: iso[3].padStart(2, "0"),
        };
    }

    const digits = trimmed.replace(/\D/g, "");
    if (digits.length !== 8) return null;

    return {
        day: digits.slice(0, 2),
        month: digits.slice(2, 4),
        year: digits.slice(4),
    };
}

export default function DateOfBirthInput({
    id,
    value,
    onChange,
    disabled = false,
    error,
    className = DEFAULT_CLASS,
    required = false,
}: DateOfBirthInputProps) {
    const { t } = useTranslation("common");
    const [parts, setParts] = useState<DateParts>(() =>
        datePartsFromIso(value),
    );
    const [prevValue, setPrevValue] = useState(value);

    if (prevValue !== value) {
        setPrevValue(value);
        if (value !== isoFromParts(parts)) {
            setParts(datePartsFromIso(value));
        }
    }

    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

    const update = (next: DateParts) => {
        setParts(next);
        onChange(isoFromParts(next));
    };

    const handleChange =
        (field: keyof DateParts) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const maxLength = field === "year" ? 4 : 2;
            const digits = event.target.value
                .replace(/\D/g, "")
                .slice(0, maxLength);
            const next = { ...parts, [field]: digits };
            update(next);

            if (field === "day" && digits.length === 2) {
                monthRef.current?.focus();
            } else if (field === "month" && digits.length === 2) {
                yearRef.current?.focus();
            }
        };

    const handleKeyDown =
        (field: keyof DateParts) =>
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Backspace" && parts[field] === "") {
                if (field === "month") {
                    event.preventDefault();
                    dayRef.current?.focus();
                } else if (field === "year") {
                    event.preventDefault();
                    monthRef.current?.focus();
                }
            }
        };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const parsed = parsePastedDate(event.clipboardData.getData("text"));
        if (!parsed) return;

        event.preventDefault();
        update(parsed);
        yearRef.current?.focus();
    };

    const errorId = `${id}-error`;

    return (
        <div>
            <div
                className={`flex items-center gap-1 ${className} ${
                    error ? "ring-1 ring-red-500/60" : ""
                } ${disabled ? "opacity-60" : ""}`}
            >
                <input
                    ref={dayRef}
                    id={`${id}-day`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-day"
                    aria-label={t("dateOfBirth.day")}
                    placeholder="DD"
                    maxLength={2}
                    value={parts.day}
                    onChange={handleChange("day")}
                    onKeyDown={handleKeyDown("day")}
                    onPaste={handlePaste}
                    disabled={disabled}
                    required={required}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? true : undefined}
                    className={`${SEGMENT_CLASS} w-8`}
                />
                <span
                    aria-hidden="true"
                    className="text-slate-400 dark:text-noir-text-muted"
                >
                    /
                </span>
                <input
                    ref={monthRef}
                    id={`${id}-month`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-month"
                    aria-label={t("dateOfBirth.month")}
                    placeholder="MM"
                    maxLength={2}
                    value={parts.month}
                    onChange={handleChange("month")}
                    onKeyDown={handleKeyDown("month")}
                    onPaste={handlePaste}
                    disabled={disabled}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? true : undefined}
                    className={`${SEGMENT_CLASS} w-8`}
                />
                <span
                    aria-hidden="true"
                    className="text-slate-400 dark:text-noir-text-muted"
                >
                    /
                </span>
                <input
                    ref={yearRef}
                    id={`${id}-year`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday-year"
                    aria-label={t("dateOfBirth.year")}
                    placeholder="AAAA"
                    maxLength={4}
                    value={parts.year}
                    onChange={handleChange("year")}
                    onKeyDown={handleKeyDown("year")}
                    onPaste={handlePaste}
                    disabled={disabled}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? true : undefined}
                    className={`${SEGMENT_CLASS} w-12`}
                />
            </div>

            {error && (
                <p
                    id={errorId}
                    role="alert"
                    className="mt-1 text-[11px] text-red-600 dark:text-red-400"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
