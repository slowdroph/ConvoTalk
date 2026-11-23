import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { act } from "react";
import { normalizeLanguage } from "@shared/i18n";
import i18n, { LANGUAGE_STORAGE_KEY } from "../../i18n";
import { LanguageProvider } from "../../providers/LanguageProvider";
import { useLanguage } from "../../hooks/useLanguage";

const mocks = vi.hoisted(() => ({
    updateUser: vi.fn(),
    showToast: vi.fn(),
    put: vi.fn(),
    user: { current: null as unknown },
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({
        user: mocks.user.current,
        updateUser: mocks.updateUser,
    }),
}));

vi.mock("../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: mocks.showToast }),
}));

vi.mock("../../services/api", () => ({
    default: { put: mocks.put },
}));

function Probe() {
    const { language, isSyncing, setLanguage } = useLanguage();

    return (
        <div>
            <span data-testid="language">{language}</span>
            <span data-testid="syncing">{String(isSyncing)}</span>
            <button type="button" onClick={() => void setLanguage("en")}>
                switch
            </button>
        </div>
    );
}

function renderProvider() {
    return render(
        <LanguageProvider>
            <Probe />
        </LanguageProvider>,
    );
}

describe("language persistence", () => {
    beforeEach(async () => {
        await i18n.changeLanguage("pt-BR");
        localStorage.clear();
        document.documentElement.lang = "pt-BR";
    });

    it("switches instantly, persists the choice and updates the document", async () => {
        await act(() => i18n.changeLanguage("es"));

        expect(i18n.t("common:actions.save")).toBe("Guardar");
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
        expect(document.documentElement.lang).toBe("es");
    });

    it("normalizes regional and unknown variants", () => {
        expect(normalizeLanguage("en-US")).toBe("en");
        expect(normalizeLanguage("pt")).toBe("pt-BR");
        expect(normalizeLanguage("xx")).toBe("en");
        expect(normalizeLanguage(undefined)).toBe("en");
    });
});

describe("LanguageProvider account sync", () => {
    beforeEach(async () => {
        await i18n.changeLanguage("pt-BR");
        localStorage.clear();
        mocks.updateUser.mockReset();
        mocks.showToast.mockReset();
        mocks.put.mockReset();
    });

    it("applies the account preference on startup", async () => {
        mocks.user.current = {
            _id: "user-1",
            name: "Ana",
            email: "ana@example.com",
            preferences: { language: "fr" },
        };

        renderProvider();

        await waitFor(() => expect(i18n.language).toBe("fr"));
        expect(screen.getByTestId("language")).toHaveTextContent("fr");
    });

    it("updates optimistically and persists the preference", async () => {
        mocks.user.current = {
            _id: "user-1",
            name: "Ana",
            email: "ana@example.com",
            preferences: { language: "pt-BR" },
        };
        mocks.put.mockResolvedValue({
            data: { preferences: { language: "en" } },
        });

        renderProvider();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "switch" }));
        });

        await waitFor(() => expect(i18n.language).toBe("en"));
        expect(mocks.put).toHaveBeenCalledWith("/user/preferences", {
            language: "en",
        });
        expect(mocks.updateUser).toHaveBeenCalled();
        expect(mocks.showToast).not.toHaveBeenCalled();
    });

    it("rolls back and warns when the preference cannot be saved", async () => {
        mocks.user.current = {
            _id: "user-1",
            name: "Ana",
            email: "ana@example.com",
            preferences: { language: "pt-BR" },
        };
        mocks.put.mockRejectedValue(new Error("offline"));

        renderProvider();

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "switch" }));
        });

        await waitFor(() => expect(i18n.language).toBe("pt-BR"));
        expect(mocks.showToast).toHaveBeenCalledWith({
            type: "error",
            message: i18n.t("language.syncError"),
        });
        expect(screen.getByTestId("syncing")).toHaveTextContent("false");
    });
});
