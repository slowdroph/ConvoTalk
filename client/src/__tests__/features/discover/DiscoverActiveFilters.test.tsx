import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DiscoverActiveFilters from "../../../features/discover/components/DiscoverActiveFilters";
import { emptyDiscoverFilters } from "../../../features/discover/utils";

describe("DiscoverActiveFilters", () => {
    it("não renderiza nada sem filtros", () => {
        const { container } = render(
            <DiscoverActiveFilters
                filters={emptyDiscoverFilters()}
                onChange={vi.fn()}
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("mostra todos os filtros ativos", () => {
        render(
            <DiscoverActiveFilters
                filters={{
                    ...emptyDiscoverFilters(),
                    country: "BR",
                    city: "São Paulo",
                    languages: ["pt"],
                    interests: ["ai"],
                    activeWithin: "24h",
                }}
                onChange={vi.fn()}
            />,
        );

        expect(screen.getByText("País: Brasil")).toBeInTheDocument();
        expect(screen.getByText("Cidade: São Paulo")).toBeInTheDocument();
        expect(screen.getByText("Idioma: Português")).toBeInTheDocument();
        expect(screen.getByText("Interesse: Inteligência Artificial")).toBeInTheDocument();
        expect(screen.getByText("Atividade: Últimas 24h")).toBeInTheDocument();
    });

    it("remove o país junto com a cidade", () => {
        const onChange = vi.fn();
        render(
            <DiscoverActiveFilters
                filters={{
                    ...emptyDiscoverFilters(),
                    country: "BR",
                    city: "São Paulo",
                }}
                onChange={onChange}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Remover filtro País: Brasil" }),
        );

        expect(onChange).toHaveBeenCalledWith({ country: "", city: "" });
    });

    it("remove um interesse específico", () => {
        const onChange = vi.fn();
        render(
            <DiscoverActiveFilters
                filters={{
                    ...emptyDiscoverFilters(),
                    interests: ["ai", "music"],
                }}
                onChange={onChange}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Remover filtro Interesse: Inteligência Artificial",
            }),
        );

        expect(onChange).toHaveBeenCalledWith({ interests: ["music"] });
    });
});
