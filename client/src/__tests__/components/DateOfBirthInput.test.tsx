import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DateOfBirthInput from "../../components/ui/DateOfBirthInput";

function Harness({ initial = "" }: { initial?: string }) {
    const [value, setValue] = useState(initial);
    return (
        <>
            <DateOfBirthInput id="dob" value={value} onChange={setValue} />
            <output data-testid="iso">{value}</output>
        </>
    );
}

describe("DateOfBirthInput", () => {
    it("preenche os segmentos com auto-avanço e emite ISO", () => {
        render(<Harness />);

        const day = screen.getByLabelText("Dia");
        const month = screen.getByLabelText("Mês");
        const year = screen.getByLabelText("Ano");

        fireEvent.change(day, { target: { value: "10" } });
        expect(month).toHaveFocus();

        fireEvent.change(month, { target: { value: "05" } });
        expect(year).toHaveFocus();

        fireEvent.change(year, { target: { value: "1995" } });

        expect(screen.getByTestId("iso")).toHaveTextContent("1995-05-10");
    });

    it("formata um valor inicial existente", () => {
        render(<Harness initial="1995-05-10" />);

        expect(screen.getByLabelText("Dia")).toHaveValue("10");
        expect(screen.getByLabelText("Mês")).toHaveValue("05");
        expect(screen.getByLabelText("Ano")).toHaveValue("1995");
    });

    it("aceita colagem no formato ISO", () => {
        render(<Harness />);

        fireEvent.paste(screen.getByLabelText("Dia"), {
            clipboardData: { getData: () => "1995-05-10" },
        });

        expect(screen.getByLabelText("Dia")).toHaveValue("10");
        expect(screen.getByLabelText("Mês")).toHaveValue("05");
        expect(screen.getByLabelText("Ano")).toHaveValue("1995");
        expect(screen.getByTestId("iso")).toHaveTextContent("1995-05-10");
    });

    it("aceita colagem no formato DD/MM/AAAA", () => {
        render(<Harness />);

        fireEvent.paste(screen.getByLabelText("Mês"), {
            clipboardData: { getData: () => "10/05/1995" },
        });

        expect(screen.getByTestId("iso")).toHaveTextContent("1995-05-10");
    });

    it("volta ao segmento anterior com backspace vazio", () => {
        render(<Harness />);
        const day = screen.getByLabelText("Dia");
        const month = screen.getByLabelText("Mês");

        fireEvent.change(day, { target: { value: "10" } });
        fireEvent.change(month, { target: { value: "05" } });
        fireEvent.change(month, { target: { value: "" } });
        fireEvent.keyDown(month, { key: "Backspace" });

        expect(day).toHaveFocus();
    });

    it("mostra a mensagem de erro", () => {
        const onChange = vi.fn();
        render(
            <DateOfBirthInput
                id="dob"
                value=""
                onChange={onChange}
                error="Data de nascimento inválida."
            />,
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Data de nascimento inválida.",
        );
    });
});
