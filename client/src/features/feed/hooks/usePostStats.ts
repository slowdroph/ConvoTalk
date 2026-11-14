import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../../../utils/errors";
import type { PostStats } from "../../../types";
import { getPostStats } from "../services/feedApi";

export function usePostStats() {
    const [stats, setStats] = useState<PostStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const refresh = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const data = await getPostStats();
            if (requestId !== requestIdRef.current) return;
            setStats(data);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            setError(
                getErrorMessage(err, "Erro ao carregar as estatísticas."),
            );
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refresh();

        const handleFocus = () => {
            void refresh();
        };
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [refresh]);

    return { stats, loading, error, refresh };
}
