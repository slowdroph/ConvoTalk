import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { BottomNavProvider } from "../../providers/BottomNavProvider";
import { useBottomNav } from "../../hooks/useBottomNav";

const PREF_KEY = "convotalk:chat-hide-bottom-nav";

function Harness() {
    const { hidden, manualHidden, toggleManual, setComposerActive } =
        useBottomNav();

    return (
        <div>
            <span data-testid="hidden">{hidden ? "yes" : "no"}</span>
            <span data-testid="manual">{manualHidden ? "yes" : "no"}</span>
            <button onClick={toggleManual}>alternar</button>
            <button onClick={() => setComposerActive(true)}>digitar</button>
            <button onClick={() => setComposerActive(false)}>parar</button>
        </div>
    );
}

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <BottomNavProvider>
                <Harness />
            </BottomNavProvider>
        </MemoryRouter>,
    );
}

describe("BottomNavProvider", () => {
    it("esconde a navegação enquanto o compositor está ativo", async () => {
        const user = userEvent.setup();
        renderAt("/chat/room-1");

        expect(screen.getByTestId("hidden")).toHaveTextContent("no");

        await user.click(screen.getByRole("button", { name: "digitar" }));
        expect(screen.getByTestId("hidden")).toHaveTextContent("yes");

        await user.click(screen.getByRole("button", { name: "parar" }));
        expect(screen.getByTestId("hidden")).toHaveTextContent("no");
    });

    it("persiste a preferência de recolher a navegação", async () => {
        const user = userEvent.setup();
        renderAt("/chat/room-1");

        await user.click(screen.getByRole("button", { name: "alternar" }));

        expect(screen.getByTestId("manual")).toHaveTextContent("yes");
        expect(screen.getByTestId("hidden")).toHaveTextContent("yes");
        expect(localStorage.getItem(PREF_KEY)).toBe("1");
    });

    it("ignora a preferência fora das conversas", () => {
        localStorage.setItem(PREF_KEY, "1");
        renderAt("/feed");

        expect(screen.getByTestId("manual")).toHaveTextContent("yes");
        expect(screen.getByTestId("hidden")).toHaveTextContent("no");
    });
});
