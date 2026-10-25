import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import userEvent from "@testing-library/user-event";
import AiComposerMenu from "../../../features/ai/components/AiComposerMenu";

type MenuProps = ComponentProps<typeof AiComposerMenu>;

function setup(overrides: Partial<MenuProps> = {}) {
    const props: MenuProps = {
        loading: null,
        error: null,
        suggestions: [],
        onSuggest: vi.fn(),
        onSummarize: vi.fn(),
        onUseSuggestion: vi.fn(),
        onClearError: vi.fn(),
        ...overrides,
    };

    const view = render(<AiComposerMenu {...props} />);

    return { props, ...view, user: userEvent.setup() };
}

function openMenu(user: ReturnType<typeof userEvent.setup>) {
    return user.click(
        screen.getByRole("button", { name: "Assistente de IA" }),
    );
}

describe("AiComposerMenu", () => {
    it("abre o menu com as ações de IA registradas", async () => {
        const { user } = setup();

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();

        await openMenu(user);

        expect(screen.getByRole("menu")).toBeInTheDocument();
        expect(
            screen.getByRole("menuitem", { name: /Sugerir respostas/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("menuitem", { name: /Resumir conversa/i }),
        ).toBeInTheDocument();
    });

    it("dispara a sugestão e mostra o resultado no popover", async () => {
        const { props, user } = setup({
            suggestions: [
                { tone: "friendly", text: "Combinado!" },
                { tone: "formal", text: "Confirmo a reunião." },
            ],
        });

        await openMenu(user);
        await user.click(
            screen.getByRole("menuitem", { name: /Sugerir respostas/i }),
        );

        expect(props.onSuggest).toHaveBeenCalledTimes(1);
        expect(
            screen.getByText("Sugestões de resposta"),
        ).toBeInTheDocument();
        expect(screen.getByText("Combinado!")).toBeInTheDocument();
    });

    it("mostra o spinner apenas enquanto gera novas sugestões", async () => {
        const { props, user, rerender } = setup();

        await openMenu(user);
        await user.click(
            screen.getByRole("menuitem", { name: /Sugerir respostas/i }),
        );

        let refresh = screen.getByRole("button", {
            name: "Gerar outras sugestões",
        });
        expect(refresh).toBeEnabled();
        expect(
            within(refresh).queryByTestId("ai-spinner"),
        ).not.toBeInTheDocument();
        expect(refresh.querySelector("svg")).not.toBeNull();

        rerender(<AiComposerMenu {...props} loading="suggest" />);

        refresh = screen.getByRole("button", {
            name: "Gerar outras sugestões",
        });
        expect(refresh).toBeDisabled();
        expect(within(refresh).getByTestId("ai-spinner")).toBeInTheDocument();
        expect(refresh.querySelector("svg")).toBeNull();

        rerender(<AiComposerMenu {...props} loading={null} />);

        refresh = screen.getByRole("button", {
            name: "Gerar outras sugestões",
        });
        expect(refresh).toBeEnabled();
        expect(
            within(refresh).queryByTestId("ai-spinner"),
        ).not.toBeInTheDocument();
    });

    it("pede novas sugestões ao clicar em gerar outras", async () => {
        const { props, user } = setup({
            suggestions: [{ tone: "short", text: "Combinado!" }],
        });

        await openMenu(user);
        await user.click(
            screen.getByRole("menuitem", { name: /Sugerir respostas/i }),
        );
        expect(props.onSuggest).toHaveBeenLastCalledWith();

        await user.click(
            screen.getByRole("button", { name: "Gerar outras sugestões" }),
        );

        expect(props.onSuggest).toHaveBeenLastCalledWith(true);
    });

    it("insere a sugestão escolhida e fecha o popover", async () => {
        const { props, user } = setup({
            suggestions: [{ tone: "short", text: "Combinado!" }],
        });

        await openMenu(user);
        await user.click(
            screen.getByRole("menuitem", { name: /Sugerir respostas/i }),
        );
        await user.click(
            screen.getByRole("button", { name: /Combinado!/i }),
        );

        expect(props.onUseSuggestion).toHaveBeenCalledWith("Combinado!");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("abre o resumo e fecha o menu", async () => {
        const { props, user } = setup();

        await openMenu(user);
        await user.click(
            screen.getByRole("menuitem", { name: /Resumir conversa/i }),
        );

        expect(props.onSummarize).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("exibe erro da sugestão no popover", async () => {
        const { user } = setup({ error: "Assistente sobrecarregado." });

        await openMenu(user);
        await user.click(
            screen.getByRole("menuitem", { name: /Sugerir respostas/i }),
        );

        expect(
            screen.getByText("Assistente sobrecarregado."),
        ).toBeInTheDocument();
    });

    it("volta ao menu de ações e fecha com Escape", async () => {
        const { user } = setup();

        await openMenu(user);
        await user.click(
            screen.getByRole("menuitem", { name: /Sugerir respostas/i }),
        );
        await user.click(
            screen.getByRole("button", { name: "Voltar para as ações de IA" }),
        );

        expect(screen.getByRole("menu")).toBeInTheDocument();

        fireEvent.keyDown(document, { key: "Escape" });

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
});
