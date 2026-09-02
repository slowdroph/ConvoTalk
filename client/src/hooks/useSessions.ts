import { useState, useEffect, useCallback, useRef } from "react";
import { getSessions, deleteSession, deleteAllSessions } from "../services/api";
import type { Session } from "../types";

export function useSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);
    const fetchedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            if (fetchedRef.current) return;
            fetchedRef.current = true;

            try {
                const data = await getSessions();
                if (!cancelled && mountedRef.current) {
                    setSessions(data);
                    setLoading(false);
                }
            } catch {
                if (!cancelled && mountedRef.current) {
                    setError("Erro ao carregar sessões.");
                    setLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            cancelled = true;
        };
    }, []);

    const refetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getSessions();
            if (mountedRef.current) {
                setSessions(data);
            }
        } catch {
            if (mountedRef.current) {
                setError("Erro ao carregar sessões.");
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    const removeSession = useCallback(
        async (sessionId: string) => {
            try {
                await deleteSession(sessionId);
                setSessions((prev) => prev.filter((s) => s._id !== sessionId));
            } catch {
                setError("Erro ao encerrar sessão.");
                throw new Error("Erro ao encerrar sessão.");
            }
        },
        [],
    );

    const removeAllOtherSessions = useCallback(async () => {
        try {
            await deleteAllSessions();
            setSessions((prev) => prev.filter((s) => s.current));
        } catch {
            setError("Erro ao encerrar outras sessões.");
            throw new Error("Erro ao encerrar outras sessões.");
        }
    }, []);

    return {
        sessions,
        loading,
        error,
        refetch,
        removeSession,
        removeAllOtherSessions,
    };
}
