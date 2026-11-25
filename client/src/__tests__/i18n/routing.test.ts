import { describe, expect, it, beforeEach } from "vitest";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/constants";
import {
    languageFromPath,
    isLocalizablePath,
    localizePath,
    stripLocale,
} from "../../i18n/routing";
import {
    readPersistedLanguage,
    resolvePrivateLanguage,
    resolvePublicLanguage,
} from "../../i18n/languageResolution";

describe("public route language resolution", () => {
    it.each([
        ["/", "en"],
        ["/login", "en"],
        ["/terms", "en"],
        ["/privacy", "en"],
        ["/forgot-password", "en"],
        ["/es", "es"],
        ["/es/login", "es"],
        ["/pt-br", "pt-BR"],
        ["/pt-br/privacy", "pt-BR"],
        ["/fr", "fr"],
        ["/fr/terms", "fr"],
        ["/en/terms", "en"],
    ])("resolves %s as %s", (pathname, expected) => {
        expect(resolvePublicLanguage(pathname)).toBe(expected);
    });

    it("returns null for private and unknown routes", () => {
        expect(resolvePublicLanguage("/chat")).toBeNull();
        expect(resolvePublicLanguage("/settings")).toBeNull();
        expect(resolvePublicLanguage("/de")).toBeNull();
    });

    it("keeps the existing URL utilities consistent", () => {
        expect(languageFromPath("/")).toBeNull();
        expect(languageFromPath("/pt-br/terms")).toBe("pt-BR");
        expect(stripLocale("/fr/privacy")).toBe("/privacy");
        expect(localizePath("es", "/terms")).toBe("/es/terms");
        expect(isLocalizablePath("/pt-br")).toBe(true);
    });
});

describe("private route language preference cascade", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("prefers the account preference", () => {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
        expect(resolvePrivateLanguage("fr")).toBe("fr");
    });

    it("falls back to the stored language", () => {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "pt-BR");
        expect(resolvePrivateLanguage()).toBe("pt-BR");
        expect(readPersistedLanguage()).toBe("pt-BR");
    });

    it("ignores unsupported stored values", () => {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "xx");
        expect(readPersistedLanguage()).toBeNull();
    });
});
