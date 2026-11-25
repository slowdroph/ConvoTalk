import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
    DEFAULT_LANGUAGE,
    normalizeLanguage,
    type LanguageCode,
} from "@shared/i18n";
import i18n from "../i18n";
import {
    persistLanguage,
    resolvePrivateLanguage,
    resolvePublicLanguage,
} from "../i18n/languageResolution";
import { LanguageContext } from "../contexts/LanguageContext";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";

function subscribeToLanguage(onStoreChange: () => void) {
    const handleChange = () => onStoreChange();
    i18n.on("languageChanged", handleChange);
    return () => {
        i18n.off("languageChanged", handleChange);
    };
}

function getLanguageSnapshot(): LanguageCode {
    return normalizeLanguage(i18n.resolvedLanguage || i18n.language);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const { pathname } = useLocation();
    const accountLanguage = user?.preferences?.language;
    const routeLanguage = resolvePublicLanguage(pathname);

    const language = useSyncExternalStore(
        subscribeToLanguage,
        getLanguageSnapshot,
        () => DEFAULT_LANGUAGE,
    );
    const [isSyncing, setIsSyncing] = useState(false);
    const pathnameRef = useRef(pathname);
    const userRef = useRef(user);
    const requestRef = useRef(0);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const desiredLanguage =
        routeLanguage ?? resolvePrivateLanguage(accountLanguage);

    useLayoutEffect(() => {
        pathnameRef.current = pathname;

        if (
            normalizeLanguage(i18n.resolvedLanguage || i18n.language) !==
            desiredLanguage
        ) {
            void i18n.changeLanguage(desiredLanguage);
        }
    }, [desiredLanguage, pathname]);

    const setLanguage = useCallback(
        async (next: LanguageCode) => {
            // Public routes change language by navigating; the URL owns it.
            if (resolvePublicLanguage(pathnameRef.current)) return;

            const normalized = normalizeLanguage(next);
            const currentUser = userRef.current;
            const previous = normalizeLanguage(
                i18n.resolvedLanguage || i18n.language,
            );
            if (normalized === previous) return;

            persistLanguage(normalized);

            if (!currentUser) {
                await i18n.changeLanguage(normalized);
                return;
            }

            const requestId = requestRef.current + 1;
            requestRef.current = requestId;
            const optimisticUser = {
                ...currentUser,
                preferences: {
                    ...(currentUser.preferences ?? {}),
                    language: normalized,
                },
            };

            // Update the account preference in the same render as the language
            // so the private-route resolver cannot override the choice.
            updateUser(optimisticUser);
            setIsSyncing(true);
            await i18n.changeLanguage(normalized);

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
                updateUser(currentUser);
                persistLanguage(previous);

                // A public URL owns the language; only roll back on private routes.
                if (!resolvePublicLanguage(pathnameRef.current)) {
                    await i18n.changeLanguage(previous);
                }

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
