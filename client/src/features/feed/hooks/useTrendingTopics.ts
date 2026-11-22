import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../../../utils/errors";
import type { TrendingTopic } from "../../../types";
import { getTrendingTopics } from "../services/feedApi";

export function useTrendingTopics(limit = 5) {
    const { t } = useTranslation("feed");
    const [topics, setTopics] = useState<TrendingTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const refresh = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const data = await getTrendingTopics(limit);
            if (requestId !== requestIdRef.current) return;
            setTopics(data);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(
                getErrorMessage(err, t("hooks.trendingError")),
            );
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [limit, t]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refresh();
    }, [refresh]);

    return { topics, loading, error, refresh };
}
