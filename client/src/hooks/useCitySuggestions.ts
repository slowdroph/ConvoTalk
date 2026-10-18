import { useEffect, useMemo, useState } from "react";

const loaders = import.meta.glob<string[]>("../data/cities/*.json", {
    import: "default",
});

const loaded = new Map<string, string[]>();
const pending = new Map<string, Promise<string[]>>();

const MAX_SUGGESTIONS = 8;

function normalize(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function loadCountryCities(code: string): Promise<string[]> {
    const cached = loaded.get(code);
    if (cached) return Promise.resolve(cached);

    const inFlight = pending.get(code);
    if (inFlight) return inFlight;

    const loader = loaders[`../data/cities/${code}.json`];
    if (!loader) {
        loaded.set(code, []);
        return Promise.resolve([]);
    }

    const promise = loader()
        .then((cities) => {
            loaded.set(code, cities);
            pending.delete(code);
            return cities;
        })
        .catch((err) => {
            pending.delete(code);
            throw err;
        });

    pending.set(code, promise);
    return promise;
}

function filterSuggestions(cities: string[], needle: string): string[] {
    const prefix: string[] = [];
    const substring: string[] = [];
    for (const city of cities) {
        const normalized = normalize(city);
        if (normalized.startsWith(needle)) prefix.push(city);
        else if (normalized.includes(needle)) substring.push(city);
    }
    return [...prefix, ...substring].slice(0, MAX_SUGGESTIONS);
}

export function useCitySuggestions(
    country?: string | null,
    query?: string | null,
): { suggestions: string[]; loading: boolean } {
    const code = country ? country.toUpperCase() : "";
    const trimmed = (query ?? "").trim();

    const [resolved, setResolved] = useState<{
        code: string;
        cities: string[];
    } | null>(null);

    useEffect(() => {
        if (!code) return;

        let active = true;
        loadCountryCities(code)
            .then((cities) => {
                if (active) setResolved({ code, cities });
            })
            .catch(() => {
                // Chunk falhou (rede/deploy): resolve vazio para não deixar loading preso.
                // "loaded" não é gravado, então um remount tenta de novo.
                if (active) setResolved({ code, cities: [] });
            });
        return () => {
            active = false;
        };
    }, [code]);

    const cities = useMemo(() => {
        if (!code) return null;
        if (loaded.has(code)) return loaded.get(code) ?? null;
        if (resolved?.code === code) return resolved.cities;
        return null;
    }, [code, resolved]);

    const needle = trimmed ? normalize(trimmed) : "";

    const suggestions = useMemo(
        () => (cities && needle ? filterSuggestions(cities, needle) : []),
        [cities, needle],
    );

    const loading = Boolean(code) && cities === null;

    return { suggestions, loading };
}
