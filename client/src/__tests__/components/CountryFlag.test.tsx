import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CountryFlag from "../../components/ui/CountryFlag";

describe("CountryFlag", () => {
    it("renderiza null sem country", () => {
        const { container } = render(<CountryFlag country="" />);
        expect(container.innerHTML).toBe("");
    });

    it("renderiza null com country undefined", () => {
        const { container } = render(<CountryFlag />);
        expect(container.innerHTML).toBe("");
    });

    it("renderiza a bandeira com aria-label para código válido", async () => {
        render(<CountryFlag country="BR" name="Brasil" />);
        const flag = await screen.findByRole("img", { name: "Brasil" });
        expect(flag).toBeInTheDocument();
    });

    it("normaliza o código para maiúsculas", async () => {
        render(<CountryFlag country="br" />);
        expect(await screen.findByRole("img")).toBeInTheDocument();
    });

    it("renderiza bandeira lazy para código antes fora do mapa curado", async () => {
        render(<CountryFlag country="AO" name="Angola" />);
        const flag = await screen.findByRole("img", { name: "Angola" });
        expect(flag).toBeInTheDocument();
    });

    it("renderiza null para código inexistente", () => {
        const { container } = render(<CountryFlag country="ZZ" />);
        expect(container.innerHTML).toBe("");
    });
});
