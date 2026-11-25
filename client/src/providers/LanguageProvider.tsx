import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { isLanguageCode, normalizeLanguage, type LanguageCode } from "@shared/i18n";
import i18n from "../i18n";
import { isLocalizablePath } from "../i18n/routing";
import { LanguageContext } from "../contexts/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [language, setLanguageState] = useState<LanguageCode>(() =>
        normalizeLanguage(i18n.resolvedLanguage || i18n.language),
    );
    const [isSyncing, setIsSyncing] = useState(false);
    const languageRef = useRef(language);
    const userRef = useRef(user);
    const requestRef = useRef(0);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        const handleLanguageChanged = (next: string) => {
            const normalized = normalizeLanguage(next);
            languageRef.current = normalized;
            setLanguageState(normalized);
        };

        i18n.on("languageChanged", handleLanguageChanged);
        return () => {
            i18n.off("languageChanged", handleLanguageChanged);
        };
    }, []);

    const accountLanguage = user?.preferences?.language;

    useEffect(() => {
        if (!isLanguageCode(accountLanguage)) return;
        if (accountLanguage === languageRef.current) return;
        // On public pages the URL owns the language, not the account.
        if (isLocalizablePath(window.location.pathname)) return;
        void i18n.changeLanguage(accountLanguage);
    }, [accountLanguage]);

    const setLanguage = useCallback(
        async (next: LanguageCode) => {
            const normalized = normalizeLanguage(next);
            const currentUser = userRef.current;
            const previous = languageRef.current;
            if (normalized === previous) return;

            await i18n.changeLanguage(normalized);

            if (!currentUser) return;

            const requestId = requestRef.current + 1;
            requestRef.current = requestId;
            const optimisticUser = {
                ...currentUser,
                preferences: {
                    ...(currentUser.preferences ?? {}),
                    language: normalized,
                },
            };

            updateUser(optimisticUser);
            setIsSyncing(true);

            try {
                const { data } = await api.put("/user/preferences", {
                    language: normalized,
                });
                if (requestRef.current !== requestId) return;
                if (data?.preferences) {
                    updateUser({
                        ...optimisticUser,
                        preferences: data.preferences,
                    });
                }
            } catch {
                if (requestRef.current !== requestId) return;
                await i18n.changeLanguage(previous);
                updateUser(currentUser);
                showToast({
                    type: "error",
                    message: i18n.t("language.syncError"),
                });
            } finally {
                if (requestRef.current === requestId) {
                    setIsSyncing(false);
                }
            }
        },
        [showToast, updateUser],
    );

    return (
        <LanguageContext.Provider value={{ language, isSyncing, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}
