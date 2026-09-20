import { useState, useEffect, useCallback } from "react";
import { getSessions, deleteSession, deleteAllSessions } from "../services/api";
import type { Session } from "../types";

export function useSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                const data = await getSessions();
                if (!cancelled) {
                    setSessions(data);
                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
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
            setSessions(data);
        } catch {
            setError("Erro ao carregar sessões.");
        } finally {
            setLoading(false);
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
