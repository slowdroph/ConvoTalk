import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FeedFilters from "../../../features/feed/components/FeedFilters";
import { resolveFeedQuery } from "../../../features/feed/services/feedApi";

describe("FeedFilters", () => {
    it("marca o filtro ativo e troca ao clicar", () => {
        const onChange = vi.fn();
        render(<FeedFilters value="all" onChange={onChange} />);

        const popular = screen.getByRole("button", { name: "Populares" });
        expect(popular).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(popular);
        expect(onChange).toHaveBeenCalledWith("popular");

        expect(
            screen.getByRole("button", { name: /Todos os Posts/ }),
        ).toHaveAttribute("aria-pressed", "true");
    });

    it("seleciona o filtro Salvos", () => {
        const onChange = vi.fn();
        render(<FeedFilters value="all" onChange={onChange} />);

        const saved = screen.getByRole("button", { name: "Salvos" });
        expect(saved).not.toBeDisabled();

        fireEvent.click(saved);
        expect(onChange).toHaveBeenCalledWith("saved");
    });

    it("renderiza a variante em chips", () => {
        render(
            <FeedFilters value="media" onChange={vi.fn()} variant="chips" />,
        );

        expect(
            screen.getByRole("button", { name: "Mídia & Fotos" }),
        ).toHaveAttribute("aria-pressed", "true");
    });

    it("traduz o filtro da interface para a consulta da API", () => {
        expect(resolveFeedQuery("all")).toEqual({
            filter: "all",
            sort: "recent",
        });
        expect(resolveFeedQuery("popular")).toEqual({
            filter: "all",
            sort: "popular",
        });
        expect(resolveFeedQuery("media")).toEqual({
            filter: "media",
            sort: "recent",
        });
        expect(resolveFeedQuery("mine")).toEqual({
            filter: "mine",
            sort: "recent",
        });
        expect(resolveFeedQuery("saved")).toEqual({
            filter: "all",
            sort: "recent",
        });
    });
});
