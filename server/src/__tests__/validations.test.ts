import { describe, it, expect } from "vitest";
import { INTEREST_OPTIONS, MAX_INTERESTS } from "../../../shared/interests";
import {
    LANGUAGE_OPTIONS,
    MAX_LANGUAGES,
} from "../../../shared/profile";
import {
    registerSchema,
    loginSchema,
    profileSchema,
    aboutSchema,
    locationSchema,
    messagesQuerySchema,
    messageSearchQuerySchema,
    userSearchQuerySchema,
    discoverQuerySchema,
    deleteRoomParams,
    directRoomSchema,
    createGroupRoomSchema,
    patchVisibilitySchema,
    publicRoomsQuerySchema,
} from "../validations";

describe("auth validations", () => {
    const validRegisterBody = {
        name: "Ana",
        email: "ana@test.com",
        password: "12345678",
        acceptedTerms: true,
        gender: "woman",
        birthdate: "1995-05-10",
        country: "BR",
        city: "São Paulo",
        languages: ["pt", "en"],
    };

    it("aceita dados de registro válidos", () => {
        const result = registerSchema.safeParse({ body: validRegisterBody });
        expect(result.success).toBe(true);
    });

    it("rejeita registro sem aceitar os termos", () => {
        const result = registerSchema.safeParse({
            body: {
                ...validRegisterBody,
                acceptedTerms: false,
            },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita senha curta no registro", () => {
        const result = registerSchema.safeParse({
            body: {
                ...validRegisterBody,
                password: "123",
            },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita registro de menor de 18 anos", () => {
        const year = new Date().getUTCFullYear() - 10;
        const result = registerSchema.safeParse({
            body: {
                ...validRegisterBody,
                birthdate: `${year}-01-01`,
            },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita gênero inválido no registro", () => {
        const result = registerSchema.safeParse({
            body: { ...validRegisterBody, gender: "invalido" },
        });
        expect(result.success).toBe(false);
    });

    it("exige pelo menos um idioma no registro", () => {
        const result = registerSchema.safeParse({
            body: { ...validRegisterBody, languages: [] },
        });
        expect(result.success).toBe(false);
    });

    it("aceita níveis de idioma válidos no registro", () => {
        const result = registerSchema.safeParse({
            body: {
                ...validRegisterBody,
                languageLevels: { pt: "fluent", en: "intermediate" },
            },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita nível de idioma inválido", () => {
        const result = registerSchema.safeParse({
            body: {
                ...validRegisterBody,
                languageLevels: { pt: "expert" },
            },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita nível para idioma não selecionado", () => {
        const result = registerSchema.safeParse({
            body: {
                ...validRegisterBody,
                languageLevels: { fr: "fluent" },
            },
        });
        expect(result.success).toBe(false);
    });

    it("aceita níveis válidos na atualização do perfil", () => {
        const result = aboutSchema.safeParse({
            body: {
                bio: "",
                interests: [],
                languages: ["pt"],
                languageLevels: { pt: "advanced" },
            },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita nível sem os idiomas correspondentes na atualização", () => {
        const result = aboutSchema.safeParse({
            body: {
                bio: "",
                interests: [],
                languageLevels: { pt: "advanced" },
            },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita idiomas repetidos no registro", () => {
        const result = registerSchema.safeParse({
            body: { ...validRegisterBody, languages: ["pt", "pt"] },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita cidade vazia no registro", () => {
        const result = registerSchema.safeParse({
            body: { ...validRegisterBody, city: "   " },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita email inválido no login", () => {
        const result = loginSchema.safeParse({
            body: { email: "nao-e-email", password: "123456" },
        });
        expect(result.success).toBe(false);
    });
});

describe("profile validations", () => {
    const baseBody = { name: "Ana", email: "ana@test.com" };

    it("aceita dados de perfil válidos", () => {
        const result = profileSchema.safeParse({ body: baseBody });
        expect(result.success).toBe(true);
    });

    it("aceita perfil com currentPassword", () => {
        const result = profileSchema.safeParse({
            body: { ...baseBody, currentPassword: "senha123" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita perfil sem nome", () => {
        const result = profileSchema.safeParse({
            body: { email: "ana@test.com" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita perfil com email inválido", () => {
        const result = profileSchema.safeParse({
            body: { ...baseBody, email: "nao-e-email" },
        });
        expect(result.success).toBe(false);
    });
});

describe("about validations", () => {
    it("aceita bio e interesses válidos", () => {
        const result = aboutSchema.safeParse({
            body: {
                bio: "Oi, sou dev.",
                interests: ["programming", "coffee"],
            },
        });
        expect(result.success).toBe(true);
    });

    it("aceita interesses e idiomas do catálogo ampliado", () => {
        const result = aboutSchema.safeParse({
            body: {
                bio: "",
                interests: ["astronomy", "hiking"],
                languages: ["th", "nl"],
            },
        });
        expect(result.success).toBe(true);
    });

    it("respeita o novo limite de interesses", () => {
        const interests = INTEREST_OPTIONS.slice(0, MAX_INTERESTS + 1).map(
            (option) => option.id,
        );
        const result = aboutSchema.safeParse({
            body: { bio: "", interests },
        });
        expect(result.success).toBe(false);
    });

    it("respeita o novo limite de idiomas", () => {
        const languages = LANGUAGE_OPTIONS.slice(0, MAX_LANGUAGES + 1).map(
            (option) => option.id,
        );
        const result = aboutSchema.safeParse({
            body: { bio: "", interests: [], languages },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita interesse desconhecido", () => {
        const result = aboutSchema.safeParse({
            body: { bio: "", interests: ["nao-existe"] },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita interesses repetidos", () => {
        const result = aboutSchema.safeParse({
            body: { bio: "", interests: ["coffee", "coffee"] },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita bio acima de 1000 caracteres", () => {
        const result = aboutSchema.safeParse({
            body: { bio: "a".repeat(1001), interests: [] },
        });
        expect(result.success).toBe(false);
    });

    it("aceita dados pessoais e idiomas no about", () => {
        const result = aboutSchema.safeParse({
            body: {
                bio: "",
                interests: [],
                gender: "nonbinary",
                birthdate: "1990-03-15",
                country: "BR",
                city: "Recife",
                languages: ["pt", "es"],
            },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita data de nascimento de menor no about", () => {
        const year = new Date().getUTCFullYear() - 10;
        const result = aboutSchema.safeParse({
            body: {
                bio: "",
                interests: [],
                birthdate: `${year}-01-01`,
            },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita idioma desconhecido no about", () => {
        const result = aboutSchema.safeParse({
            body: { bio: "", interests: [], languages: ["klingon"] },
        });
        expect(result.success).toBe(false);
    });

    it("aceita status no about", () => {
        const result = aboutSchema.safeParse({
            body: { bio: "", interests: [], status: "Disponível" },
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.body.status).toBe("Disponível");
        }
    });

    it("rejeita status com mais de 100 caracteres no about", () => {
        const result = aboutSchema.safeParse({
            body: { bio: "", interests: [], status: "a".repeat(101) },
        });
        expect(result.success).toBe(false);
    });
});

describe("location validations", () => {
    it("aceita país e cidade válidos", () => {
        const result = locationSchema.safeParse({
            body: { country: "BR", city: "São Paulo" },
        });
        expect(result.success).toBe(true);
    });

    it("aceita payload vazio (não altera nada)", () => {
        const result = locationSchema.safeParse({ body: {} });
        expect(result.success).toBe(true);
    });

    it("aceita country e city null para limpar os campos", () => {
        const result = locationSchema.safeParse({
            body: { country: null, city: null },
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.body.country).toBeNull();
            expect(result.data.body.city).toBeNull();
        }
    });

    it("rejeita country com mais de 2 letras", () => {
        const result = locationSchema.safeParse({ body: { country: "BRA" } });
        expect(result.success).toBe(false);
    });

    it("rejeita country minúsculo", () => {
        const result = locationSchema.safeParse({ body: { country: "br" } });
        expect(result.success).toBe(false);
    });

    it("rejeita country com caracteres especiais", () => {
        const result = locationSchema.safeParse({ body: { country: "B!" } });
        expect(result.success).toBe(false);
    });

    it("aceita city com 80 caracteres", () => {
        const result = locationSchema.safeParse({
            body: { city: "a".repeat(80) },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita city com mais de 80 caracteres", () => {
        const result = locationSchema.safeParse({
            body: { city: "a".repeat(81) },
        });
        expect(result.success).toBe(false);
    });

    it("aplica trim na city", () => {
        const result = locationSchema.safeParse({
            body: { city: "  São Paulo  " },
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.body.city).toBe("São Paulo");
        }
    });
});

describe("message validations", () => {
    const validRoomId = "507f1f77bcf86cd799439011";
    const validDate = "2024-01-01T00:00:00.000Z";

    it("aceita payload de busca válido", () => {
        const result = messageSearchQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { q: "olá", limit: 20 },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita roomId inválido", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: "abc" },
            query: { limit: 50 },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita before não-datetime", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { limit: 50, before: "ontem" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita limit acima do máximo", () => {
        const result = messageSearchQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { q: "olá", limit: 999 },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita limit acima do máximo", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { limit: 101 },
        });
        expect(result.success).toBe(false);
    });

    it("aceita cursor com beforeId para tie-break", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { limit: 50, before: validDate, beforeId: "507f1f77bcf86cd799439012" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita beforeId inválido", () => {
        const result = messagesQuerySchema.safeParse({
            params: { roomId: validRoomId },
            query: { limit: 50, before: validDate, beforeId: "xyz" },
        });
        expect(result.success).toBe(false);
    });
});

describe("room validations", () => {
    it("aceita directRoomSchema com userId válido", () => {
        const result = directRoomSchema.safeParse({
            body: { userId: "507f1f77bcf86cd799439011" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita deleteRoomParams com id inválido", () => {
        const result = deleteRoomParams.safeParse({
            params: { id: "não-é-id" },
        });
        expect(result.success).toBe(false);
    });

    it("aceita grupo público na criação", () => {
        const result = createGroupRoomSchema.safeParse({
            body: { name: "Estudos", visibility: "public" },
        });
        expect(result.success).toBe(true);
    });

    it("aplica visibilidade private por padrão na criação", () => {
        const result = createGroupRoomSchema.safeParse({
            body: { name: "Estudos" },
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.body.visibility).toBe("private");
        }
    });

    it("rejeita visibilidade inválida na criação", () => {
        const result = createGroupRoomSchema.safeParse({
            body: { name: "Estudos", visibility: "aberto" },
        });
        expect(result.success).toBe(false);
    });

    it("aceita troca de visibilidade válida", () => {
        const result = patchVisibilitySchema.safeParse({
            params: { id: "507f1f77bcf86cd799439011" },
            body: { visibility: "public" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita troca de visibilidade inválida", () => {
        const result = patchVisibilitySchema.safeParse({
            params: { id: "507f1f77bcf86cd799439011" },
            body: { visibility: "aberto" },
        });
        expect(result.success).toBe(false);
    });

    it("aplica padrões na busca de grupos públicos", () => {
        const result = publicRoomsQuerySchema.safeParse({ query: {} });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.query.q).toBe("");
            expect(result.data.query.limit).toBe(20);
        }
    });

    it("rejeita limit acima do máximo na busca de grupos públicos", () => {
        const result = publicRoomsQuerySchema.safeParse({
            query: { q: "estudos", limit: 51 },
        });
        expect(result.success).toBe(false);
    });
});

describe("user search validations", () => {
    it("aceita busca com 3+ caracteres", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "ana" },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita busca curta que permitiria enumeração", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "a" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita termo acima de 50 caracteres", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "a".repeat(51) },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita busca por email com mensagem clara", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "ana@test.com" },
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                "Busca por email foi desativada",
            );
        }
    });

    it("aceita busca por #ID", () => {
        const result = userSearchQuerySchema.safeParse({
            query: { q: "#ABCD1234" },
        });
        expect(result.success).toBe(true);
    });
});

describe("discover validations", () => {
    it("aplica defaults quando nenhum filtro é enviado", () => {
        const result = discoverQuerySchema.safeParse({ query: {} });
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.query).toMatchObject({
            sort: "active",
            page: 1,
            limit: 12,
        });
    });

    it("interpreta listas separadas por vírgula e remove duplicatas", () => {
        const result = discoverQuerySchema.safeParse({
            query: {
                country: "br",
                city: "São Paulo",
                languages: "pt, en,pt",
                interests: "programming,ai",
                activeWithin: "7d",
                sort: "recent",
                page: "2",
                limit: "24",
            },
        });
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.query.country).toBe("BR");
        expect(result.data.query.languages).toEqual(["pt", "en"]);
        expect(result.data.query.interests).toEqual(["programming", "ai"]);
        expect(result.data.query.sort).toBe("recent");
        expect(result.data.query.page).toBe(2);
        expect(result.data.query.limit).toBe(24);
    });

    it("trata q vazio como ausente", () => {
        const result = discoverQuerySchema.safeParse({ query: { q: "   " } });
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.query.q).toBeUndefined();
    });

    it("rejeita cidade sem país", () => {
        const result = discoverQuerySchema.safeParse({
            query: { city: "Lisboa" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita país inválido", () => {
        const result = discoverQuerySchema.safeParse({
            query: { country: "BRA" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita idioma inválido", () => {
        const result = discoverQuerySchema.safeParse({
            query: { languages: "pt,xx" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita interesse inválido", () => {
        const result = discoverQuerySchema.safeParse({
            query: { interests: "not-a-real-interest" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita mais de 5 opções por filtro", () => {
        const result = discoverQuerySchema.safeParse({
            query: { languages: "pt,en,es,fr,de,it" },
        });
        expect(result.success).toBe(false);
    });

    it("rejeita ordenação e período inválidos", () => {
        expect(
            discoverQuerySchema.safeParse({ query: { sort: "popular" } })
                .success,
        ).toBe(false);
        expect(
            discoverQuerySchema.safeParse({ query: { activeWithin: "12h" } })
                .success,
        ).toBe(false);
    });

    it("rejeita page/limit acima do máximo", () => {
        expect(
            discoverQuerySchema.safeParse({ query: { page: 21 } }).success,
        ).toBe(false);
        expect(
            discoverQuerySchema.safeParse({ query: { limit: 25 } }).success,
        ).toBe(false);
    });

    it("rejeita busca curta e busca por email", () => {
        expect(
            discoverQuerySchema.safeParse({ query: { q: "ana@test.com" } })
                .success,
        ).toBe(false);
        expect(
            discoverQuerySchema.safeParse({ query: { q: "ab" } }).success,
        ).toBe(false);
    });
});

describe("push validations", () => {
    it("aceita payload de inscrição válido", async () => {
        const { pushSubscribeSchema } = await import("../validations");
        const result = pushSubscribeSchema.safeParse({
            body: {
                endpoint: "https://fcm.googleapis.com/fcm/send/sample-token",
                keys: {
                    p256dh: "key-p256dh",
                    auth: "key-auth",
                },
                userAgent: "Mozilla/5.0",
            },
        });
        expect(result.success).toBe(true);
    });

    it("rejeita inscrição com endpoint que não é URL", async () => {
        const { pushSubscribeSchema } = await import("../validations");
        const result = pushSubscribeSchema.safeParse({
            body: {
                endpoint: "invalid-url",
                keys: {
                    p256dh: "key-p256dh",
                    auth: "key-auth",
                },
            },
        });
        expect(result.success).toBe(false);
    });

    it("aceita payload de desinscrição válido", async () => {
        const { pushUnsubscribeSchema } = await import("../validations");
        const result = pushUnsubscribeSchema.safeParse({
            body: {
                endpoint: "https://fcm.googleapis.com/fcm/send/sample-token",
            },
        });
        expect(result.success).toBe(true);
    });
});