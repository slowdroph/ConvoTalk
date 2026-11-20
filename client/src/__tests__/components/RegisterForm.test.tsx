import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterForm from "../../components/Auth/RegisterForm";

const { registerMock } = vi.hoisted(() => ({
    registerMock: vi.fn(),
}));

vi.mock("../../hooks/useAuth", () => ({
    useAuth: () => ({ register: registerMock }),
}));

vi.mock("../../lib/ads", () => ({
    reportSignupConversion: vi.fn(),
}));

const continueButton = () => screen.getByRole("button", { name: "Continuar" });

function fillAccountStep() {
    fireEvent.change(screen.getByLabelText("Nome"), {
        target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
        target: { value: "ana@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
        target: { value: "12345678" },
    });
}

function goToPersonalStep() {
    fillAccountStep();
    fireEvent.click(continueButton());
}

function fillPersonalStep() {
    fireEvent.change(screen.getByLabelText("Gênero"), {
        target: { value: "woman" },
    });
    fillBirthdate();
}

function fillBirthdate(day = "10", month = "05", year = "1995") {
    fireEvent.change(screen.getByLabelText("Dia"), {
        target: { value: day },
    });
    fireEvent.change(screen.getByLabelText("Mês"), {
        target: { value: month },
    });
    fireEvent.change(screen.getByLabelText("Ano"), {
        target: { value: year },
    });
}

function goToLocationStep() {
    goToPersonalStep();
    fillPersonalStep();
    fireEvent.click(continueButton());
}

function fillLocationStep() {
    fireEvent.change(screen.getByLabelText("País"), {
        target: { value: "BR" },
    });
    fireEvent.change(screen.getByLabelText("Cidade"), {
        target: { value: "São Paulo" },
    });
}

function goToLanguagesStep() {
    goToLocationStep();
    fillLocationStep();
    fireEvent.click(continueButton());
}

function clickCreateAccount() {
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
}

describe("RegisterForm", () => {
    beforeEach(() => {
        registerMock.mockReset();
        registerMock.mockResolvedValue({ message: "ok" });
    });

    it("avança as quatro etapas e envia todos os dados no cadastro", async () => {
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        expect(screen.getByText("Etapa 1 de 4")).toBeInTheDocument();

        fillAccountStep();
        fireEvent.click(continueButton());
        expect(screen.getByText("Etapa 2 de 4")).toBeInTheDocument();

        fillPersonalStep();
        fireEvent.click(continueButton());
        expect(screen.getByText("Etapa 3 de 4")).toBeInTheDocument();

        fillLocationStep();
        fireEvent.click(continueButton());
        expect(screen.getByText("Etapa 4 de 4")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Português/ }));
        fireEvent.change(screen.getByLabelText("Nível de Português"), {
            target: { value: "fluent" },
        });
        fireEvent.click(screen.getByRole("checkbox"));
        clickCreateAccount();

        await waitFor(() =>
            expect(registerMock).toHaveBeenCalledWith({
                name: "Ana",
                email: "ana@test.com",
                password: "12345678",
                gender: "woman",
                birthdate: "1995-05-10",
                country: "BR",
                city: "São Paulo",
                languages: ["pt"],
                languageLevels: { pt: "fluent" },
            }),
        );
        expect(
            await screen.findByText("Verifique seu email"),
        ).toBeInTheDocument();
    });

    it("não avança com email inválido", () => {
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        fillAccountStep();
        fireEvent.change(screen.getByLabelText("E-mail"), {
            target: { value: "nao-e-email" },
        });
        fireEvent.click(continueButton());

        expect(screen.getByText("Email inválido.")).toBeInTheDocument();
        expect(screen.getByText("Etapa 1 de 4")).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it("exige gênero na etapa sobre você", () => {
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        goToPersonalStep();
        fireEvent.click(continueButton());

        expect(screen.getByText("Selecione seu gênero.")).toBeInTheDocument();
        expect(screen.getByText("Etapa 2 de 4")).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it("bloqueia o cadastro de menor de 18 anos", () => {
        const year = new Date().getUTCFullYear() - 10;
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        goToPersonalStep();
        fireEvent.change(screen.getByLabelText("Gênero"), {
            target: { value: "woman" },
        });
        fillBirthdate("01", "01", String(year));
        fireEvent.click(continueButton());

        expect(
            screen.getByText("É necessário ter pelo menos 18 anos."),
        ).toBeInTheDocument();
        expect(screen.getByText("Etapa 2 de 4")).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it("exige país e cidade na etapa de localização", () => {
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        goToLocationStep();
        fireEvent.click(continueButton());
        expect(screen.getByText("Selecione seu país.")).toBeInTheDocument();
        expect(screen.getByText("Etapa 3 de 4")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("País"), {
            target: { value: "BR" },
        });
        fireEvent.click(continueButton());
        expect(screen.getByText("Informe sua cidade.")).toBeInTheDocument();
        expect(screen.getByText("Etapa 3 de 4")).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it("exige pelo menos um idioma", () => {
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        goToLanguagesStep();
        fireEvent.click(screen.getByRole("checkbox"));
        clickCreateAccount();

        expect(
            screen.getByText("Selecione pelo menos um idioma."),
        ).toBeInTheDocument();
        expect(registerMock).not.toHaveBeenCalled();
    });

    it("só habilita a criação após aceitar os termos", () => {
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        goToLanguagesStep();
        fireEvent.click(screen.getByRole("button", { name: /Português/ }));

        expect(screen.getByRole("button", { name: "Criar conta" })).toBeDisabled();

        fireEvent.click(screen.getByRole("checkbox"));

        expect(
            screen.getByRole("button", { name: "Criar conta" }),
        ).toBeEnabled();
    });

    it("volta de etapa preservando os dados preenchidos", () => {
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        fillAccountStep();
        fireEvent.click(continueButton());
        expect(screen.getByLabelText("Gênero")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

        expect(screen.getByLabelText("Nome")).toHaveValue("Ana");
        expect(screen.getByLabelText("E-mail")).toHaveValue("ana@test.com");
        expect(screen.getByText("Etapa 1 de 4")).toBeInTheDocument();
    });

    it("expõe o progresso acessível e não oferece voltar na primeira etapa", () => {
        render(<RegisterForm onSwitchToLogin={vi.fn()} />);

        const progress = screen.getByRole("progressbar", {
            name: "Progresso do cadastro",
        });
        expect(progress).toHaveAttribute("aria-valuenow", "1");
        expect(progress).toHaveAttribute("aria-valuemax", "4");
        expect(
            screen.queryByRole("button", { name: "Voltar" }),
        ).not.toBeInTheDocument();

        fillAccountStep();
        fireEvent.click(continueButton());

        expect(
            screen.getByRole("progressbar", {
                name: "Progresso do cadastro",
            }),
        ).toHaveAttribute("aria-valuenow", "2");
        expect(
            screen.getByRole("button", { name: "Voltar" }),
        ).toBeInTheDocument();
    });
});
