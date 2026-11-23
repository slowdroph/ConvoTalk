import { describe, expect, it } from "vitest";
import {
    countActiveDiscoverFilters,
    emptyDiscoverFilters,
    hasActiveDiscoverFilters,
    parseDiscoverFilters,
    serializeDiscoverFilters,
    toDiscoverQuery,
} from "../../../features/discover/utils";

describe("discover utils", () => {
    it("aplica defaults em URL vazia", () => {
        expect(parseDiscoverFilters(new URLSearchParams())).toEqual(
            emptyDiscoverFilters(),
        );
    });

    it("interpreta filtros válidos da URL", () => {
        const filters = parseDiscoverFilters(
            new URLSearchParams(
                "q=ana&country=br&city=Lisboa&languages=pt,en&interests=ai,music&activeWithin=7d&sort=name",
            ),
        );

        expect(filters).toEqual({
            q: "ana",
            country: "BR",
            city: "Lisboa",
            languages: ["pt", "en"],
            interests: ["ai", "music"],
            activeWithin: "7d",
            sort: "name",
        });
    });

    it("descarta valores inválidos, duplicados e acima do limite", () => {
        const filters = parseDiscoverFilters(
            new URLSearchParams(
                "country=BRA&languages=pt,xx,pt,en,es,fr,de,it,pt-BR&interests=nope&activeWithin=12h&sort=popular",
            ),
        );

        expect(filters.country).toBe("");
        expect(filters.languages).toEqual(["pt", "en", "es", "fr", "de"]);
        expect(filters.interests).toEqual([]);
        expect(filters.activeWithin).toBeNull();
        expect(filters.sort).toBe("active");
    });

    it("descarta cidade sem país", () => {
        const filters = parseDiscoverFilters(
            new URLSearchParams("city=Lisboa"),
        );
        expect(filters.city).toBe("");
    });

    it("serializa apenas filtros ativos", () => {
        const params = serializeDiscoverFilters({
            q: "ana",
            country: "BR",
            city: "São Paulo",
            languages: ["pt"],
            interests: ["ai"],
            activeWithin: "24h",
            sort: "recent",
        });

        expect(params.get("q")).toBe("ana");
        expect(params.get("country")).toBe("BR");
        expect(params.get("city")).toBe("São Paulo");
        expect(params.get("languages")).toBe("pt");
        expect(params.get("interests")).toBe("ai");
        expect(params.get("activeWithin")).toBe("24h");
        expect(params.get("sort")).toBe("recent");
    });

    it("não serializa busca com @ nem ordenação padrão", () => {
        const params = serializeDiscoverFilters({
            ...emptyDiscoverFilters(),
            q: "ana@test.com",
        });
        expect(params.toString()).toBe("");
    });

    it("mantém busca curta na URL mas não a envia para a API", () => {
        const filters = { ...emptyDiscoverFilters(), q: "an" };
        expect(serializeDiscoverFilters(filters).get("q")).toBe("an");
        expect(toDiscoverQuery(filters, 1).q).toBeUndefined();
    });

    it("monta a query da API com página e limite", () => {
        const query = toDiscoverQuery(
            {
                q: "ana",
                country: "BR",
                city: "São Paulo",
                languages: ["pt", "en"],
                interests: ["ai"],
                activeWithin: "30d",
                sort: "active",
            },
            2,
        );

        expect(query).toEqual({
            q: "ana",
            country: "BR",
            city: "São Paulo",
            languages: "pt,en",
            interests: "ai",
            activeWithin: "30d",
            sort: "active",
            page: 2,
            limit: 12,
        });
    });

    it("detecta filtros ativos sem considerar busca e ordenação", () => {
        expect(
            hasActiveDiscoverFilters({
                ...emptyDiscoverFilters(),
                q: "ana",
                sort: "name",
            }),
        ).toBe(false);
        expect(
            hasActiveDiscoverFilters({
                ...emptyDiscoverFilters(),
                languages: ["pt"],
            }),
        ).toBe(true);
    });

    it("conta os filtros ativos para o botão mobile", () => {
        expect(
            countActiveDiscoverFilters({
                ...emptyDiscoverFilters(),
                country: "BR",
                city: "São Paulo",
                languages: ["pt", "en"],
                activeWithin: "24h",
            }),
        ).toBe(5);
    });
});
