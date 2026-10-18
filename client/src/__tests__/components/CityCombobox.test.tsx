import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CityCombobox from "../../components/ui/CityCombobox";

function Harness() {
    return (
        <form>
            <CityCombobox
                id="input-city"
                value=""
                onChange={() => {}}
                country="BR"
                maxLength={80}
                placeholder="Ex: São Paulo"
            />
        </form>
    );
}

function TypedHarness({
    onSubmit,
    country = "BR",
}: {
    onSubmit?: () => void;
    country?: string;
}) {
    const [value, setValue] = useState("");
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.();
            }}
        >
            <CityCombobox
                id="input-city"
                value={value}
                onChange={setValue}
                country={country}
                maxLength={80}
                placeholder="Ex: São Paulo"
            />
        </form>
    );
}

describe("CityCombobox", () => {
    it("renderiza o input com atributos de combobox", () => {
        render(<Harness />);
        const input = screen.getByRole("combobox");
        expect(input).toHaveAttribute("aria-autocomplete", "list");
        expect(input).toHaveAttribute("aria-expanded", "false");
        expect(input).toHaveAttribute("maxLength", "80");
    });

    it("mostra sugestões ao digitar", async () => {
        const user = userEvent.setup();
        render(<TypedHarness />);
        await user.click(screen.getByRole("combobox"));
        await user.type(screen.getByRole("combobox"), "sao");

        const options = await screen.findAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
        expect(options.map((o) => o.textContent)).toContain("São Paulo");
    });

    it("navega com setas e seleciona com Enter sem submeter o form", async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<TypedHarness onSubmit={onSubmit} />);
        const input = screen.getByRole("combobox");
        await user.click(input);
        await user.type(input, "sao");
        await screen.findAllByRole("option");

        await user.keyboard("{ArrowDown}");
        expect(input).toHaveAttribute("aria-activedescendant");

        await user.keyboard("{Enter}");
        expect(onSubmit).not.toHaveBeenCalled();
        expect(input).toHaveValue("São Paulo");
    });

    it("submete o form com Enter quando não há highlight", async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<TypedHarness onSubmit={onSubmit} />);
        const input = screen.getByRole("combobox");
        await user.click(input);
        await user.type(input, "{Enter}");
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("fecha o dropdown com Escape", async () => {
        const user = userEvent.setup();
        render(<TypedHarness />);
        const input = screen.getByRole("combobox");
        await user.click(input);
        await user.type(input, "sao");
        await screen.findAllByRole("option");

        await user.keyboard("{Escape}");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("aceita texto livre sem match nas sugestões", async () => {
        const user = userEvent.setup();
        render(<TypedHarness />);
        const input = screen.getByRole("combobox");
        await user.click(input);
        await user.type(input, "Minha Cidade Inexistente");
        expect(input).toHaveValue("Minha Cidade Inexistente");
    });

    it("seleciona sugestão por clique com texto parcial digitado", async () => {
        const user = userEvent.setup();
        render(<TypedHarness />);
        const input = screen.getByRole("combobox");
        await user.click(input);
        await user.type(input, "sao pau");

        const option = await screen.findByRole("option", {
            name: "São Paulo",
        });
        await user.click(option);
        expect(input).toHaveValue("São Paulo");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("fecha o dropdown ao sair do campo com Tab", async () => {
        const user = userEvent.setup();
        render(<TypedHarness />);
        const input = screen.getByRole("combobox");
        await user.click(input);
        await user.type(input, "sao");
        await screen.findAllByRole("option");

        await user.tab();
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("não abre sugestões para país sem dataset", async () => {
        const user = userEvent.setup();
        render(<TypedHarness country="ZZ" />);
        const input = screen.getByRole("combobox");
        await user.click(input);
        await user.type(input, "algu");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
});
