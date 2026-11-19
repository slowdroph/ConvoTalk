import { describe, it, expect, vi, afterEach } from "vitest";
import { shareLink } from "../../utils/share";

const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");
const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    "clipboard",
);

function setShare(value: unknown) {
    Object.defineProperty(navigator, "share", {
        configurable: true,
        value,
    });
}

function setClipboard(value: unknown) {
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value,
    });
}

afterEach(() => {
    if (originalShare) {
        Object.defineProperty(navigator, "share", originalShare);
    } else {
        Reflect.deleteProperty(navigator, "share");
    }

    if (originalClipboard) {
        Object.defineProperty(navigator, "clipboard", originalClipboard);
    } else {
        Reflect.deleteProperty(navigator, "clipboard");
    }
});

const input = {
    title: "Perfil de Ana no ConvoTalk",
    text: "Confira o perfil de Ana",
    url: "https://app.test/profile/ana",
};

describe("shareLink", () => {
    it("usa o compartilhamento nativo quando disponível", async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        const writeText = vi.fn().mockResolvedValue(undefined);
        setShare(share);
        setClipboard({ writeText });

        const result = await shareLink(input);

        expect(result).toBe("shared");
        expect(share).toHaveBeenCalledWith(input);
        expect(writeText).not.toHaveBeenCalled();
    });

    it("trata o cancelamento da folha nativa sem copiar", async () => {
        setShare(
            vi
                .fn()
                .mockRejectedValue(
                    Object.assign(new Error("cancelado"), {
                        name: "AbortError",
                    }),
                ),
        );
        const writeText = vi.fn();
        setClipboard({ writeText });

        const result = await shareLink(input);

        expect(result).toBe("cancelled");
        expect(writeText).not.toHaveBeenCalled();
    });

    it("copia o link quando não há suporte nativo", async () => {
        setShare(undefined);
        const writeText = vi.fn().mockResolvedValue(undefined);
        setClipboard({ writeText });

        const result = await shareLink(input);

        expect(result).toBe("copied");
        expect(writeText).toHaveBeenCalledWith(input.url);
    });

    it("cai para cópia quando o compartilhamento nativo falha", async () => {
        setShare(vi.fn().mockRejectedValue(new Error("falhou")));
        const writeText = vi.fn().mockResolvedValue(undefined);
        setClipboard({ writeText });

        const result = await shareLink(input);

        expect(result).toBe("copied");
        expect(writeText).toHaveBeenCalledWith(input.url);
    });

    it("retorna failed quando nada funciona", async () => {
        setShare(vi.fn().mockRejectedValue(new Error("falhou")));
        setClipboard({
            writeText: vi.fn().mockRejectedValue(new Error("sem clipboard")),
        });

        const result = await shareLink(input);

        expect(result).toBe("failed");
    });
});
