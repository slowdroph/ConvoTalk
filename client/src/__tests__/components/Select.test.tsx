import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Select from "../../components/ui/Select";

const OPTIONS = [
    { value: "", label: "Todos" },
    { value: "br", label: "Brasil" },
    { value: "pt", label: "Portugal" },
    { value: "us", label: "Estados Unidos" },
];

const MANY_OPTIONS = [
    ...OPTIONS,
    { value: "sp", label: "São Paulo" },
    { value: "fr", label: "França" },
    { value: "es", label: "Espanha" },
    { value: "de", label: "Alemanha" },
    { value: "it", label: "Itália" },
    { value: "jp", label: "Japão" },
    { value: "cn", label: "China" },
];

function renderSelect(
    props: Partial<React.ComponentProps<typeof Select>> = {},
) {
    const onChange = vi.fn();
    render(
        <Select
            value=""
            onChange={onChange}
            options={OPTIONS}
            ariaLabel="País"
            {...props}
        />,
    );
    return { onChange };
}

describe("Select", () => {
    it("seleciona uma opção pelo clique", () => {
        const { onChange } = renderSelect();

        fireEvent.click(screen.getByLabelText("País"));
        fireEvent.click(screen.getByRole("option", { name: "Brasil" }));

        expect(onChange).toHaveBeenCalledWith("br");
    });

    it("navega e seleciona pelo teclado", () => {
        const { onChange } = renderSelect();

        fireEvent.keyDown(screen.getByLabelText("País"), {
            key: "ArrowDown",
        });
        const listbox = screen.getByRole("listbox");
        fireEvent.keyDown(listbox, { key: "ArrowDown" });
        fireEvent.keyDown(listbox, { key: "Enter" });

        expect(onChange).toHaveBeenCalledWith("br");
    });

    it("fecha com Escape sem selecionar", async () => {
        const { onChange } = renderSelect();

        fireEvent.click(screen.getByLabelText("País"));
        fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });

        await waitFor(() =>
            expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
        );
        expect(onChange).not.toHaveBeenCalled();
    });

    it("filtra opções com busca sem acentos", () => {
        const { onChange } = renderSelect({ options: MANY_OPTIONS });

        fireEvent.click(screen.getByLabelText("País"));
        fireEvent.change(screen.getByLabelText("Buscar..."), {
            target: { value: "sao" },
        });

        expect(
            screen.getByRole("option", { name: "São Paulo" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("option", { name: "Brasil" }),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("option", { name: "São Paulo" }));
        expect(onChange).toHaveBeenCalledWith("sp");
    });

    it("mostra mensagem quando a busca não encontra resultados", () => {
        renderSelect({ options: MANY_OPTIONS });

        fireEvent.click(screen.getByLabelText("País"));
        fireEvent.change(screen.getByLabelText("Buscar..."), {
            target: { value: "xyz" },
        });

        expect(screen.getByText("Nenhum resultado")).toBeInTheDocument();
    });

    it("expõe estado acessível e marca a opção selecionada", () => {
        renderSelect({ value: "br" });

        const trigger = screen.getByLabelText("País");
        expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
        expect(trigger).toHaveAttribute("aria-expanded", "false");

        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(
            screen.getByRole("option", { name: "Brasil" }),
        ).toHaveAttribute("aria-selected", "true");
    });

    it("não abre quando desabilitado", () => {
        renderSelect({ disabled: true });

        fireEvent.click(screen.getByLabelText("País"));

        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
});