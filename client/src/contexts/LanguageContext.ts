import { createContext } from "react";
import type { LanguageCode } from "@shared/i18n";

export interface LanguageContextValue {
    language: LanguageCode;
    isSyncing: boolean;
    setLanguage: (language: LanguageCode) => Promise<void>;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(
    undefined,
);
