import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
    DiscoverMode,
    DiscoverPage,
    DiscoverUser,
} from "../../../types";
import { getErrorMessage } from "../../../utils/errors";
import { getDiscoverUsers } from "../services/discoverApi";
import { toDiscoverQuery, type DiscoverFilterState } from "../utils";

function isAbortError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "ERR_CANCELED"
    );
}

function mergeUsers(
    current: DiscoverUser[],
    incoming: DiscoverUser[],
): DiscoverUser[] {
    const seen = new Set(current.map((user) => user._id));
    return [...current, ...incoming.filter((user) => !seen.has(user._id))];
}

export function useDiscover(filters: DiscoverFilterState) {
    const { t } = useTranslation("discover");
    const [users, setUsers] = useState<DiscoverUser[]>([]);
    const [mode, setMode] = useState<DiscoverMode>("suggested");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestIdRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);

    const applyPage = useCallback(
        (data: DiscoverPage, append: boolean) => {
            setUsers((prev) =>
                append ? mergeUsers(prev, data.users) : data.users,
            );
            setMode(data.mode);
            setPage(data.page);
            setHasMore(data.hasMore);
        },
        [],
    );

    const load = useCallback(
        async (targetPage = 1, append = false) => {
            const requestId = ++requestIdRef.current;
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setError(null);
            if (append) setLoadingMore(true);
            else setLoading(true);

            try {
                const data = await getDiscoverUsers(
                    toDiscoverQuery(filters, targetPage),
                    controller.signal,
                );
                if (requestId !== requestIdRef.current) return;
                applyPage(data, append);
            } catch (err) {
                if (requestId !== requestIdRef.current) return;
                if (isAbortError(err)) return;
                setError(getErrorMessage(err, t("errors.load")));
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        [applyPage, filters, t],
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load(1, false);
    }, [load]);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const loadMore = useCallback(() => {
        if (!hasMore || loading || loadingMore) return;
        void load(page + 1, true);
    }, [hasMore, load, loading, loadingMore, page]);

    const retry = useCallback(() => {
        void load(1, false);
    }, [load]);

    const retryLoadMore = useCallback(() => {
        void load(page + 1, true);
    }, [load, page]);

    return {
        users,
        mode,
        page,
        hasMore,
        loading,
        loadingMore,
        error,
        loadMore,
        retry,
        retryLoadMore,
    };
}
