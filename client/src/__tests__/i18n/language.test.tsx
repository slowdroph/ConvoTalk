import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { normalizeLanguage } from "@shared/i18n";
import i18n, { LANGUAGE_STORAGE_KEY } from "../../i18n";
import { LanguageProvider } from "../../providers/LanguageProvider";
import { useLanguage } from "../../hooks/useLanguage";
import LanguageSelector from "../../components/ui/LanguageSelector";

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

const ACCOUNT_USER = {
    _id: "user-1",
    name: "Ana",
    email: "ana@example.com",
    preferences: { language: "pt-BR" },
};

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

function LocationProbe() {
    const { pathname, search } = useLocation();
    return (
        <span data-testid="pathname">
            {pathname}
            {search}
        </span>
    );
}

function NavigateButton({ to }: { to: string }) {
    const navigate = useNavigate();
    return (
        <button type="button" onClick={() => navigate(to)}>
            navigate
        </button>
    );
}

function providerUi(initialEntry: string) {
    return (
        <MemoryRouter initialEntries={[initialEntry]}>
            <LanguageProvider>
                <Probe />
                <LocationProbe />
                <NavigateButton to="/" />
            </LanguageProvider>
        </MemoryRouter>
    );
}

function renderProvider(initialEntry = "/chat") {
    return render(providerUi(initialEntry));
}

function renderSelector(initialEntry: string) {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <LanguageProvider>
                <LanguageSelector id="test-language" />
                <LocationProbe />
            </LanguageProvider>
        </MemoryRouter>,
    );
}

function openLanguageMenu() {
    fireEvent.click(document.getElementById("test-language")!);
}

function mockBrowserLanguage(value: string) {
    const descriptor = Object.getOwnPropertyDescriptor(
        window.navigator,
        "language",
    );

    Object.defineProperty(window.navigator, "language", {
        configurable: true,
        get: () => value,
    });

    return () => {
        if (descriptor) {
            Object.defineProperty(window.navigator, "language", descriptor);
        } else {
            Reflect.deleteProperty(window.navigator, "language");
        }
    };
}

describe("language persistence", () => {
    beforeEach(async () => {
        await i18n.changeLanguage("pt-BR");
        localStorage.clear();
        document.documentElement.lang = "pt-BR";
    });

    it("updates translations and the document language", async () => {
        await act(() => i18n.changeLanguage("es"));

        expect(i18n.t("common:actions.save")).toBe("Guardar");
        expect(document.documentElement.lang).toBe("es");
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });

    it("normalizes regional and unknown variants", () => {
        expect(normalizeLanguage("en-US")).toBe("en");
        expect(normalizeLanguage("pt")).toBe("pt-BR");
        expect(normalizeLanguage("xx")).toBe("en");
        expect(normalizeLanguage(undefined)).toBe("en");
    });
});

describe("public route language resolution", () => {
    beforeEach(async () => {
        await i18n.changeLanguage("pt-BR");
        localStorage.clear();
        mocks.user.current = null;
        mocks.updateUser.mockReset();
        mocks.showToast.mockReset();
        mocks.put.mockReset();
    });

    it("uses English on / even when the browser is Portuguese", async () => {
        const restore = mockBrowserLanguage("pt-BR");
        renderProvider("/");

        await waitFor(() =>
            expect(screen.getByTestId("language")).toHaveTextContent("en"),
        );
        expect(i18n.language).toBe("en");
        expect(document.documentElement.lang).toBe("en");
        restore();
    });

    it("uses English on / even when localStorage is Portuguese", async () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "pt-BR");
        renderProvider("/");

        await waitFor(() => expect(i18n.language).toBe("en"));
        expect(screen.getByTestId("language")).toHaveTextContent("en");
    });

    it("uses the URL language on /pt-br even when the browser is English", async () => {
        const restore = mockBrowserLanguage("en-US");
        renderProvider("/pt-br");

        await waitFor(() => expect(i18n.language).toBe("pt-BR"));
        expect(screen.getByTestId("language")).toHaveTextContent("pt-BR");
        restore();
    });

    it("uses the URL language on /fr even when localStorage is Spanish", async () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
        renderProvider("/fr");

        await waitFor(() => expect(i18n.language).toBe("fr"));
        expect(screen.getByTestId("language")).toHaveTextContent("fr");
    });

    it("resolves /es as Spanish", async () => {
        renderProvider("/es");
        await waitFor(() => expect(i18n.language).toBe("es"));
    });

    it("resolves /fr as French", async () => {
        renderProvider("/fr");
        await waitFor(() => expect(i18n.language).toBe("fr"));
    });

    it("changes the active language when navigating from /pt-br to /", async () => {
        renderProvider("/pt-br");

        await waitFor(() => expect(i18n.language).toBe("pt-BR"));

        fireEvent.click(screen.getByRole("button", { name: "navigate" }));

        await waitFor(() =>
            expect(screen.getByTestId("pathname")).toHaveTextContent("/"),
        );
        await waitFor(() => expect(i18n.language).toBe("en"));
        expect(screen.getByTestId("language")).toHaveTextContent("en");
    });

    it("navigates from / to Portuguese when using the selector", async () => {
        renderSelector("/");
        await waitFor(() => expect(i18n.language).toBe("en"));

        openLanguageMenu();
        fireEvent.click(
            screen.getByRole("menuitemradio", { name: /Português/ }),
        );

        await waitFor(() =>
            expect(screen.getByTestId("pathname")).toHaveTextContent("/pt-br"),
        );
        await waitFor(() => expect(i18n.language).toBe("pt-BR"));
        expect(document.getElementById("test-language")).toHaveTextContent(
            "Português (Brasil)",
        );
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });

    it("navigates from /terms to Spanish when using the selector", async () => {
        renderSelector("/terms");
        await waitFor(() => expect(i18n.language).toBe("en"));

        openLanguageMenu();
        fireEvent.click(screen.getByRole("menuitemradio", { name: /Español/ }));

        await waitFor(() =>
            expect(screen.getByTestId("pathname")).toHaveTextContent(
                "/es/terms",
            ),
        );
        await waitFor(() => expect(i18n.language).toBe("es"));
    });

    it("keeps the selector checked state aligned with the URL", async () => {
        renderSelector("/fr");
        await waitFor(() => expect(i18n.language).toBe("fr"));

        openLanguageMenu();

        expect(
            screen.getByRole("menuitemradio", { name: /Français/ }),
        ).toHaveAttribute("aria-checked", "true");
        expect(
            screen.getByRole("menuitemradio", { name: /English/ }),
        ).toHaveAttribute("aria-checked", "false");
    });

    it("does not change the account preference or storage on public pages", async () => {
        mocks.user.current = ACCOUNT_USER;
        renderProvider("/es");

        await waitFor(() => expect(i18n.language).toBe("es"));
        expect(mocks.put).not.toHaveBeenCalled();
        expect(mocks.updateUser).not.toHaveBeenCalled();
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });
});

describe("LanguageProvider account sync", () => {
    beforeEach(async () => {
        await i18n.changeLanguage("pt-BR");
        localStorage.clear();
        mocks.user.current = null;
        mocks.updateUser.mockReset();
        mocks.showToast.mockReset();
        mocks.put.mockReset();
    });

    it("applies the account preference on private routes", async () => {
        mocks.user.current = {
            ...ACCOUNT_USER,
            preferences: { language: "fr" },
        };

        renderProvider("/chat");

        await waitFor(() => expect(i18n.language).toBe("fr"));
        expect(screen.getByTestId("language")).toHaveTextContent("fr");
    });

    it("falls back to localStorage when there is no account preference", async () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "pt-BR");

        renderProvider("/chat");

        await waitFor(() => expect(i18n.language).toBe("pt-BR"));
        expect(screen.getByTestId("language")).toHaveTextContent("pt-BR");
    });

    it("falls back to the browser language when nothing is stored", async () => {
        const restore = mockBrowserLanguage("fr-FR");

        renderProvider("/chat");

        await waitFor(() => expect(i18n.language).toBe("fr"));
        expect(screen.getByTestId("language")).toHaveTextContent("fr");
        restore();
    });

    it("updates optimistically, persists and syncs the preference", async () => {
        mocks.user.current = ACCOUNT_USER;
        mocks.put.mockResolvedValue({
            data: { preferences: { language: "en" } },
        });

        renderProvider("/chat");

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "switch" }));
        });

        await waitFor(() => expect(i18n.language).toBe("en"));
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
        expect(mocks.put).toHaveBeenCalledWith("/user/preferences", {
            language: "en",
        });
        expect(mocks.updateUser).toHaveBeenCalled();
        expect(mocks.showToast).not.toHaveBeenCalled();
    });

    it("rolls back and warns when the preference cannot be saved", async () => {
        mocks.user.current = ACCOUNT_USER;
        mocks.put.mockRejectedValue(new Error("offline"));

        renderProvider("/chat");

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "switch" }));
        });

        await waitFor(() => expect(i18n.language).toBe("pt-BR"));
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("pt-BR");
        expect(mocks.showToast).toHaveBeenCalledWith({
            type: "error",
            message: i18n.t("language.syncError"),
        });
        expect(screen.getByTestId("syncing")).toHaveTextContent("false");
    });

    it("applies an account preference that arrives after the first render", async () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");

        const { rerender } = renderProvider("/chat");
        await waitFor(() => expect(i18n.language).toBe("es"));

        mocks.user.current = {
            ...ACCOUNT_USER,
            preferences: { language: "fr" },
        };
        rerender(providerUi("/chat"));

        await waitFor(() => expect(i18n.language).toBe("fr"));
        expect(screen.getByTestId("language")).toHaveTextContent("fr");
    });

    it("does not let a late account preference change a public page", async () => {
        const { rerender } = renderProvider("/es");
        await waitFor(() => expect(i18n.language).toBe("es"));

        mocks.user.current = {
            ...ACCOUNT_USER,
            preferences: { language: "fr" },
        };
        rerender(providerUi("/es"));

        await waitFor(() =>
            expect(screen.getByTestId("language")).toHaveTextContent("es"),
        );
        expect(i18n.language).toBe("es");
        expect(mocks.put).not.toHaveBeenCalled();
    });
});
