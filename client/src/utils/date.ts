import { MAX_AGE, MIN_AGE, calculateAge } from "@shared/profile";

export interface DateParts {
    day: string;
    month: string;
    year: string;
}

export const EMPTY_DATE_PARTS: DateParts = {
    day: "",
    month: "",
    year: "",
};

export function datePartsFromIso(value: string): DateParts {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return EMPTY_DATE_PARTS;

    return { year: match[1], month: match[2], day: match[3] };
}

export function formatIsoDate(value: string): string {
    const { day, month, year } = datePartsFromIso(value);
    if (!day || !month || !year) return "";
    return `${day}/${month}/${year}`;
}

export function isValidIsoDate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (month < 1 || month > 12 || day < 1) return false;

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return day <= daysInMonth;
}

export interface DateOfBirthLimits {
    minAge?: number;
    maxAge?: number;
}

export function dateOfBirthError(
    value: string,
    { minAge = MIN_AGE, maxAge = MAX_AGE }: DateOfBirthLimits = {},
): string | null {
    if (!value) return "Informe sua data de nascimento.";
    if (!isValidIsoDate(value)) return "Data de nascimento inválida.";

    const age = calculateAge(value);
    if (age === null || age < minAge) {
        return `É necessário ter pelo menos ${minAge} anos.`;
    }
    if (age > maxAge) return "Data de nascimento inválida.";

    return null;
}
