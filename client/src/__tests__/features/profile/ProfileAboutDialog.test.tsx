import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileAboutDialog from "../../../features/profile/components/ProfileAboutDialog";
import { updateAbout } from "../../../features/profile/services/profileApi";
import { MAX_INTERESTS } from "@shared/interests";
import type { User } from "../../../types";

const { showToastMock } = vi.hoisted(() => ({
    showToastMock: vi.fn(),
}));

vi.mock("../../../contexts/ToastContext", () => ({
    useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("../../../features/profile/services/profileApi", () => ({
    updateAbout: vi.fn(),
}));

const updateAboutMock = vi.mocked(updateAbout);

const savedUser = {
    _id: "me",
    name: "Ana",
    email: "ana@test.com",
    publicId: "ANA1",
    avatar: "",
    status: "",
    bio: "Nova bio",
    interests: ["coffee"],
} as unknown as User;

function renderDialog(overrides: Partial<Parameters<typeof ProfileAboutDialog>[0]> = {}) {
    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(
        <ProfileAboutDialog
            isOpen
            bio="Bio antiga"
            interests={["programming"]}
            onClose={onClose}
            onSaved={onSaved}
            {...overrides}
        />,
    );

    return { onSaved, onClose };
}

describe("ProfileAboutDialog", () => {
    beforeEach(() => {
        showToastMock.mockReset();
        updateAboutMock.mockReset();
    });

    it("pré-carrega a bio e os interesses atuais", () => {
        renderDialog();

        expect(screen.getByLabelText("Sobre mim")).toHaveValue("Bio antiga");
        expect(
            screen.getByRole("button", { name: /Programação & Open Source/ }),
        ).toHaveAttribute("aria-pressed", "true");
        expect(
            screen.getByRole("button", { name: /Café Especial/ }),
        ).toHaveAttribute("aria-pressed", "false");
    });

    it("salva bio e interesses selecionados", async () => {
        updateAboutMock.mockResolvedValue(savedUser);
        const { onSaved, onClose } = renderDialog();

        fireEvent.change(screen.getByLabelText("Sobre mim"), {
            target: { value: "  Nova bio  " },
        });
        fireEvent.click(screen.getByRole("button", { name: /Café Especial/ }));
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        await waitFor(() =>
            expect(updateAboutMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    bio: "Nova bio",
                    interests: ["programming", "coffee"],
                }),
            ),
        );
        expect(onSaved).toHaveBeenCalledWith(savedUser);
        expect(onClose).toHaveBeenCalled();
    });

    it("salva dados pessoais e idiomas", async () => {
        updateAboutMock.mockResolvedValue(savedUser);
        renderDialog();

        fireEvent.change(screen.getByLabelText("Gênero"), {
            target: { value: "woman" },
        });
        fireEvent.change(screen.getByLabelText("Data de nascimento"), {
            target: { value: "1992-08-20" },
        });
        fireEvent.change(screen.getByLabelText("País"), {
            target: { value: "BR" },
        });
        fireEvent.change(screen.getByLabelText("Cidade"), {
            target: { value: "Recife" },
        });
        fireEvent.change(screen.getByLabelText("Status"), {
            target: { value: "  Em reunião  " },
        });
        fireEvent.click(screen.getByRole("button", { name: /Português/ }));
        fireEvent.change(screen.getByLabelText("Nível de Português"), {
            target: { value: "advanced" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        await waitFor(() =>
            expect(updateAboutMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    gender: "woman",
                    birthdate: "1992-08-20",
                    country: "BR",
                    city: "Recife",
                    status: "Em reunião",
                    languages: ["pt"],
                    languageLevels: { pt: "advanced" },
                }),
            ),
        );
    });

    it("bloqueia data de nascimento de menor", () => {
        const year = new Date().getUTCFullYear() - 10;
        renderDialog();

        fireEvent.change(screen.getByLabelText("Data de nascimento"), {
            target: { value: `${year}-01-01` },
        });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        expect(
            screen.getByText("É necessário ter pelo menos 18 anos."),
        ).toBeInTheDocument();
        expect(updateAboutMock).not.toHaveBeenCalled();
    });

    it("remove um interesse já selecionado", async () => {
        updateAboutMock.mockResolvedValue(savedUser);
        renderDialog();

        fireEvent.click(
            screen.getByRole("button", { name: /Programação & Open Source/ }),
        );
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        await waitFor(() =>
            expect(updateAboutMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    bio: "Bio antiga",
                    interests: [],
                }),
            ),
        );
    });

    it("limita a quantidade máxima de interesses", () => {
        renderDialog();

        const options = screen
            .getAllByRole("button")
            .filter((button) => button.getAttribute("aria-pressed") !== null);

        for (const option of options.slice(0, MAX_INTERESTS + 2)) {
            fireEvent.click(option);
        }

        expect(
            screen.getByText(`Escolha no máximo ${MAX_INTERESTS} interesses.`),
        ).toBeInTheDocument();
    });

    it("mostra erro quando o salvamento falha", async () => {
        updateAboutMock.mockRejectedValue(new Error("fail"));
        const { onClose } = renderDialog();

        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("fail");
        expect(onClose).not.toHaveBeenCalled();
    });
});
