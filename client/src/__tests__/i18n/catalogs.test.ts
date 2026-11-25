import { describe, expect, it } from "vitest";
import { spokenLanguageLabel } from "../../i18n/catalogs";

describe("spokenLanguageLabel", () => {
    it("usa o nome localizado quando o Intl traduz", () => {
        expect(spokenLanguageLabel("en")).toBe("Inglês");
        expect(spokenLanguageLabel("es")).toBe("Espanhol");
    });

    it("cai no rótulo do catálogo quando o Intl devolve o código", () => {
        expect(spokenLanguageLabel("fj")).toBe("Fijiano");
    });
});
