import { isInterestId } from "@shared/interests";
import { isLanguageId } from "@shared/profile";
import type {
    DiscoverActivityWindow,
    DiscoverSort,
} from "@shared/types";

export const DISCOVER_PAGE_SIZE = 12;
export const MAX_DISCOVER_FILTERS = 5;

const ACTIVITY_WINDOWS: readonly DiscoverActivityWindow[] = [
    "24h",
    "7d",
    "30d",
];

const SORTS: readonly DiscoverSort[] = ["active", "recent", "name"];

export interface DiscoverFilterState {
    q: string;
    country: string;
    city: string;
    languages: string[];
    interests: string[];
    activeWithin: DiscoverActivityWindow | null;
    sort: DiscoverSort;
}

export function emptyDiscoverFilters(): DiscoverFilterState {
    return {
        q: "",
        country: "",
        city: "",
        languages: [],
        interests: [],
        activeWithin: null,
        sort: "active",
    };
}

function parseList(
    raw: string | null,
    isValid: (value: string) => boolean,
): string[] {
    if (!raw) return [];
    const seen = new Set<string>();
    for (const item of raw.split(",")) {
        const value = item.trim();
        if (value && isValid(value)) seen.add(value);
        if (seen.size >= MAX_DISCOVER_FILTERS) break;
    }
    return Array.from(seen);
}

export function parseDiscoverFilters(
    params: URLSearchParams,
): DiscoverFilterState {
    const country = (params.get("country") ?? "").trim().toUpperCase();
    const validCountry = /^[A-Z]{2}$/.test(country) ? country : "";
    const city = (params.get("city") ?? "").trim().slice(0, 80);
    const activeWithin = params.get("activeWithin");
    const sort = params.get("sort");

    return {
        q: (params.get("q") ?? "").trim().slice(0, 50),
        country: validCountry,
        city: validCountry ? city : "",
        languages: parseList(params.get("languages"), isLanguageId),
        interests: parseList(params.get("interests"), isInterestId),
        activeWithin: ACTIVITY_WINDOWS.includes(
            activeWithin as DiscoverActivityWindow,
        )
            ? (activeWithin as DiscoverActivityWindow)
            : null,
        sort: SORTS.includes(sort as DiscoverSort)
            ? (sort as DiscoverSort)
            : "active",
    };
}

export function serializeDiscoverFilters(
    filters: DiscoverFilterState,
): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.q.trim() && !filters.q.includes("@")) {
        params.set("q", filters.q.trim());
    }
    if (filters.country) params.set("country", filters.country);
    if (filters.country && filters.city) params.set("city", filters.city);
    if (filters.languages.length) {
        params.set("languages", filters.languages.join(","));
    }
    if (filters.interests.length) {
        params.set("interests", filters.interests.join(","));
    }
    if (filters.activeWithin) {
        params.set("activeWithin", filters.activeWithin);
    }
    if (filters.sort !== "active") params.set("sort", filters.sort);

    return params;
}

export interface DiscoverRequestQuery {
    q?: string;
    country?: string;
    city?: string;
    languages?: string;
    interests?: string;
    activeWithin?: DiscoverActivityWindow;
    sort: DiscoverSort;
    page: number;
    limit: number;
}

export function toDiscoverQuery(
    filters: DiscoverFilterState,
    page: number,
): DiscoverRequestQuery {
    const query: DiscoverRequestQuery = {
        sort: filters.sort,
        page,
        limit: DISCOVER_PAGE_SIZE,
    };

    const q = filters.q.trim();
    if (q.length >= 3 && !q.includes("@")) query.q = q;
    if (filters.country) query.country = filters.country;
    if (filters.country && filters.city) query.city = filters.city;
    if (filters.languages.length) {
        query.languages = filters.languages.join(",");
    }
    if (filters.interests.length) {
        query.interests = filters.interests.join(",");
    }
    if (filters.activeWithin) query.activeWithin = filters.activeWithin;

    return query;
}

export function hasActiveDiscoverFilters(
    filters: DiscoverFilterState,
): boolean {
    return countActiveDiscoverFilters(filters) > 0;
}

export function countActiveDiscoverFilters(
    filters: DiscoverFilterState,
): number {
    return (
        (filters.country ? 1 : 0) +
        (filters.city ? 1 : 0) +
        filters.languages.length +
        filters.interests.length +
        (filters.activeWithin ? 1 : 0)
    );
}
