import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
    hasActiveDiscoverFilters,
    parseDiscoverFilters,
    serializeDiscoverFilters,
    type DiscoverFilterState,
} from "../utils";

export function useDiscoverParams() {
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo(
        () => parseDiscoverFilters(searchParams),
        [searchParams],
    );

    const updateFilters = useCallback(
        (patch: Partial<DiscoverFilterState>) => {
            setSearchParams(
                (prev) => {
                    const next = {
                        ...parseDiscoverFilters(prev),
                        ...patch,
                    };
                    if (!next.country) next.city = "";
                    return serializeDiscoverFilters(next);
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    const clearFilters = useCallback(() => {
        updateFilters({
            country: "",
            city: "",
            languages: [],
            interests: [],
            activeWithin: null,
        });
    }, [updateFilters]);

    return {
        filters,
        updateFilters,
        clearFilters,
        hasFilters: hasActiveDiscoverFilters(filters),
    };
}
