import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNavContext } from "../contexts/BottomNavContext";

const PREF_KEY = "convotalk:chat-hide-bottom-nav";

function readPreference(): boolean {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem(PREF_KEY) === "1";
    } catch {
        return false;
    }
}

export function BottomNavProvider({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    const isChatRoute = pathname.startsWith("/chat");
    const [manualHidden, setManualHidden] = useState(readPreference);
    const [composerActive, setComposerActiveState] = useState(false);

    const setComposerActive = useCallback((active: boolean) => {
        setComposerActiveState(active);
    }, []);

    const toggleManual = useCallback(() => {
        setManualHidden((prev) => !prev);
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(PREF_KEY, manualHidden ? "1" : "0");
        } catch {
            // storage may be unavailable (private mode)
        }
    }, [manualHidden]);

    const hidden = isChatRoute && (composerActive || manualHidden);

    const value = useMemo(
        () => ({
            hidden,
            manualHidden,
            toggleManual,
            setComposerActive,
        }),
        [hidden, manualHidden, toggleManual, setComposerActive],
    );

    return (
        <BottomNavContext.Provider value={value}>
            {children}
        </BottomNavContext.Provider>
    );
}
