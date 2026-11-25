import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DiscoverFilters from "../../../features/discover/components/DiscoverFilters";
import {
    emptyDiscoverFilters,
    type DiscoverFilterState,
} from "../../../features/discover/utils";

function renderFilters(
    value: DiscoverFilterState = emptyDiscoverFilters(),
    hasFilters = false,
) {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(
        <DiscoverFilters
            value={value}
            hasFilters={hasFilters}
            onChange={onChange}
            onClear={onClear}
        />,
    );
    return { onChange, onClear };
}

function expandPicker(label: string) {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}`) }));
}

describe("DiscoverFilters", () => {
    it("desabilita limpar quando não há filtros", () => {
        renderFilters();
        expect(
            screen.getByRole("button", { name: "Limpar filtros" }),
        ).toBeDisabled();
    });

    it("limpa a cidade ao trocar de país", () => {
        const { onChange } = renderFilters({
            ...emptyDiscoverFilters(),
            country: "PT",
            city: "Lisboa",
        });

        fireEvent.change(screen.getByLabelText("País"), {
            target: { value: "BR" },
        });

        expect(onChange).toHaveBeenCalledWith({ country: "BR", city: "" });
    });

    it("desabilita a cidade enquanto não há país", () => {
        renderFilters();
        expect(screen.getByLabelText("Cidade")).toBeDisabled();
        expect(
            screen.getByText("Selecione um país primeiro"),
        ).toBeInTheDocument();
    });

    it("adiciona e remove idiomas", () => {
        const { onChange } = renderFilters();
        expandPicker("Idiomas");

        fireEvent.click(screen.getByRole("button", { name: "Português" }));
        expect(onChange).toHaveBeenCalledWith({ languages: ["pt"] });
    });

    it("mantém as opções recolhidas até expandir", () => {
        renderFilters();

        expect(
            screen.queryByPlaceholderText("Buscar opções"),
        ).not.toBeInTheDocument();

        const toggle = screen.getByRole("button", { name: /^Idiomas/ });
        expect(toggle).toHaveAttribute("aria-expanded", "false");

        fireEvent.click(toggle);

        expect(toggle).toHaveAttribute("aria-expanded", "true");
        expect(
            screen.getByPlaceholderText("Buscar opções"),
        ).toBeInTheDocument();
    });

    it("respeita o máximo de idiomas selecionados", () => {
        renderFilters({
            ...emptyDiscoverFilters(),
            languages: ["pt", "en", "es", "fr", "de"],
        });
        expandPicker("Idiomas");

        expect(screen.getByRole("button", { name: "Italiano" })).toBeDisabled();
        expect(
            screen.getByText("Selecione no máximo 5 opções."),
        ).toBeInTheDocument();
    });

    it("remove um idioma selecionado", () => {
        const { onChange } = renderFilters({
            ...emptyDiscoverFilters(),
            languages: ["pt", "en"],
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Remover filtro Português" }),
        );

        expect(onChange).toHaveBeenCalledWith({ languages: ["en"] });
    });

    it("alterna a janela de atividade", () => {
        const { onChange } = renderFilters();

        fireEvent.click(screen.getByRole("button", { name: "Últimas 24h" }));
        expect(onChange).toHaveBeenCalledWith({ activeWithin: "24h" });
    });

    it("remove a atividade ao clicar novamente", () => {
        const { onChange } = renderFilters({
            ...emptyDiscoverFilters(),
            activeWithin: "7d",
        });

        fireEvent.click(screen.getByRole("button", { name: "Últimos 7 dias" }));
        expect(onChange).toHaveBeenCalledWith({ activeWithin: null });
    });

    it("atrasa a atualização da cidade", () => {
        vi.useFakeTimers();
        const { onChange } = renderFilters({
            ...emptyDiscoverFilters(),
            country: "BR",
        });

        fireEvent.change(screen.getByLabelText("Cidade"), {
            target: { value: "Santos" },
        });

        expect(onChange).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(onChange).toHaveBeenCalledWith({ city: "Santos" });
        vi.useRealTimers();
    });

    it("gera ids únicos quando há mais de um painel", () => {
        render(
            <>
                <DiscoverFilters
                    value={emptyDiscoverFilters()}
                    hasFilters={false}
                    onChange={vi.fn()}
                    onClear={vi.fn()}
                />
                <DiscoverFilters
                    value={emptyDiscoverFilters()}
                    hasFilters={false}
                    onChange={vi.fn()}
                    onClear={vi.fn()}
                    idPrefix="discover-mobile"
                />
            </>,
        );

        const countries = screen.getAllByLabelText("País");
        expect(countries).toHaveLength(2);
        expect(countries[0]).toHaveAttribute("id", "discover-country");
        expect(countries[1]).toHaveAttribute("id", "discover-mobile-country");

        const cities = screen.getAllByLabelText("Cidade");
        expect(cities).toHaveLength(2);
        expect(cities[1]).toHaveAttribute("id", "discover-mobile-city");
    });
});
