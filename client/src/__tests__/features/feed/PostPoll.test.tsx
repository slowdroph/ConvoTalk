import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PostPoll from "../../../features/feed/components/PostPoll";
import type { PostPollPayload } from "../../../types";

function makePoll(overrides: Partial<PostPollPayload> = {}): PostPollPayload {
    return {
        options: [
            { _id: "opt-1", text: "Sim", voteCount: 3 },
            { _id: "opt-2", text: "Não", voteCount: 1 },
        ],
        totalVotes: 4,
        myVoteOptionId: null,
        ...overrides,
    };
}

describe("PostPoll", () => {
    it("mostra percentuais e total de votos", () => {
        render(<PostPoll poll={makePoll()} onVote={vi.fn()} />);

        expect(screen.getByText("75%")).toBeInTheDocument();
        expect(screen.getByText("25%")).toBeInTheDocument();
        expect(screen.getByText(/4 votos/)).toBeInTheDocument();
    });

    it("vota em uma opção não selecionada", () => {
        const onVote = vi.fn();
        render(<PostPoll poll={makePoll()} onVote={onVote} />);

        fireEvent.click(screen.getByRole("button", { name: "Votar em Sim" }));

        expect(onVote).toHaveBeenCalledWith("opt-1");
    });

    it("remove o voto ao clicar na opção selecionada", () => {
        const onVote = vi.fn();
        render(
            <PostPoll
                poll={makePoll({ myVoteOptionId: "opt-1" })}
                onVote={onVote}
            />,
        );

        const selected = screen.getByRole("button", {
            name: "Remover voto de Sim",
        });
        expect(selected).toHaveAttribute("aria-pressed", "true");

        fireEvent.click(selected);
        expect(onVote).toHaveBeenCalledWith(null);
    });

    it("desabilita as opções enquanto vota", () => {
        render(<PostPoll poll={makePoll()} voting onVote={vi.fn()} />);

        expect(
            screen.getByRole("button", { name: "Votar em Sim" }),
        ).toBeDisabled();
        expect(
            screen.getByRole("button", { name: "Votar em Não" }),
        ).toBeDisabled();
    });

    it("mostra 0% quando ainda não há votos", () => {
        render(
            <PostPoll
                poll={makePoll({
                    options: [
                        { _id: "opt-1", text: "Sim", voteCount: 0 },
                        { _id: "opt-2", text: "Não", voteCount: 0 },
                    ],
                    totalVotes: 0,
                })}
                onVote={vi.fn()}
            />,
        );

        expect(screen.getAllByText("0%")).toHaveLength(2);
        expect(screen.getByText(/0 votos/)).toBeInTheDocument();
    });
});
