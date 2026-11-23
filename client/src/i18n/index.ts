import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import {
    DEFAULT_LANGUAGE,
    FALLBACK_LANGUAGE,
    normalizeLanguage,
    SUPPORTED_LANGUAGES,
} from "@shared/i18n";

import ptBRCommon from "./locales/pt-BR/common.json";
import ptBRAuth from "./locales/pt-BR/auth.json";
import ptBRChat from "./locales/pt-BR/chat.json";
import ptBRSettings from "./locales/pt-BR/settings.json";
import ptBRFeed from "./locales/pt-BR/feed.json";
import ptBRDiscover from "./locales/pt-BR/discover.json";
import ptBRProfile from "./locales/pt-BR/profile.json";
import ptBRHome from "./locales/pt-BR/home.json";
import ptBRLegal from "./locales/pt-BR/legal.json";
import ptBRErrors from "./locales/pt-BR/errors.json";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enChat from "./locales/en/chat.json";
import enSettings from "./locales/en/settings.json";
import enFeed from "./locales/en/feed.json";
import enDiscover from "./locales/en/discover.json";
import enProfile from "./locales/en/profile.json";
import enHome from "./locales/en/home.json";
import enLegal from "./locales/en/legal.json";
import enErrors from "./locales/en/errors.json";

import esCommon from "./locales/es/common.json";
import esAuth from "./locales/es/auth.json";
import esChat from "./locales/es/chat.json";
import esSettings from "./locales/es/settings.json";
import esFeed from "./locales/es/feed.json";
import esDiscover from "./locales/es/discover.json";
import esProfile from "./locales/es/profile.json";
import esHome from "./locales/es/home.json";
import esLegal from "./locales/es/legal.json";
import esErrors from "./locales/es/errors.json";

import frCommon from "./locales/fr/common.json";
import frAuth from "./locales/fr/auth.json";
import frChat from "./locales/fr/chat.json";
import frSettings from "./locales/fr/settings.json";
import frFeed from "./locales/fr/feed.json";
import frDiscover from "./locales/fr/discover.json";
import frProfile from "./locales/fr/profile.json";
import frHome from "./locales/fr/home.json";
import frLegal from "./locales/fr/legal.json";
import frErrors from "./locales/fr/errors.json";

export const LANGUAGE_STORAGE_KEY = "convo-talk-language";

export const NAMESPACES = [
    "common",
    "auth",
    "chat",
    "settings",
    "feed",
    "discover",
    "profile",
    "home",
    "legal",
    "errors",
] as const;

export const resources = {
    "pt-BR": {
        common: ptBRCommon,
        auth: ptBRAuth,
        chat: ptBRChat,
        settings: ptBRSettings,
        feed: ptBRFeed,
        discover: ptBRDiscover,
        profile: ptBRProfile,
        home: ptBRHome,
        legal: ptBRLegal,
        errors: ptBRErrors,
    },
    en: {
        common: enCommon,
        auth: enAuth,
        chat: enChat,
        settings: enSettings,
        feed: enFeed,
        discover: enDiscover,
        profile: enProfile,
        home: enHome,
        legal: enLegal,
        errors: enErrors,
    },
    es: {
        common: esCommon,
        auth: esAuth,
        chat: esChat,
        settings: esSettings,
        feed: esFeed,
        discover: esDiscover,
        profile: esProfile,
        home: esHome,
        legal: esLegal,
        errors: esErrors,
    },
    fr: {
        common: frCommon,
        auth: frAuth,
        chat: frChat,
        settings: frSettings,
        feed: frFeed,
        discover: frDiscover,
        profile: frProfile,
        home: frHome,
        legal: frLegal,
        errors: frErrors,
    },
} as const;

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        supportedLngs: [...SUPPORTED_LANGUAGES],
        fallbackLng: FALLBACK_LANGUAGE,
        load: "currentOnly",
        defaultNS: "common",
        ns: [...NAMESPACES],
        initAsync: false,
        returnNull: false,
        returnEmptyString: false,
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
            lookupLocalStorage: LANGUAGE_STORAGE_KEY,
            convertDetectedLanguage: (language) => normalizeLanguage(language),
        },
    });

if (typeof document !== "undefined") {
    document.documentElement.lang = normalizeLanguage(i18n.language);
}

i18n.on("languageChanged", (language) => {
    const normalized = normalizeLanguage(language);
    if (typeof document !== "undefined") {
        document.documentElement.lang = normalized;
    }
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    } catch {
        // Storage may be unavailable (private mode / quota).
    }
});

export default i18n;

export { DEFAULT_LANGUAGE };
