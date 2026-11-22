import { useState, useEffect, useCallback } from "react";
import { getSessions, deleteSession, deleteAllSessions } from "../services/api";
import i18n from "../i18n";
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
                    setError(i18n.t("settings:sessions.loadError"));
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
            setError(i18n.t("settings:sessions.loadError"));
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
                setError(i18n.t("settings:sessions.removeError"));
                throw new Error(i18n.t("settings:sessions.removeError"));
            }
        },
        [],
    );

    const removeAllOtherSessions = useCallback(async () => {
        try {
            await deleteAllSessions();
            setSessions((prev) => prev.filter((s) => s.current));
        } catch {
            setError(i18n.t("settings:sessions.removeAllError"));
            throw new Error(i18n.t("settings:sessions.removeAllError"));
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
