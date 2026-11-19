export function normalizeSearch(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function filterOptions<T extends { label: string }>(
    options: readonly T[],
    query: string,
): T[] {
    const term = normalizeSearch(query);
    if (!term) return [...options];
    return options.filter((option) =>
        normalizeSearch(option.label).includes(term),
    );
}
