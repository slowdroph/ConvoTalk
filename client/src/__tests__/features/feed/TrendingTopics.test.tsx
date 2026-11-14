import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TrendingTopics from "../../../features/feed/components/TrendingTopics";

describe("TrendingTopics", () => {
    it("mostra hashtags reais com contagem", () => {
        render(
            <TrendingTopics
                topics={[
                    { tag: "#webrtc", count: 2 },
                    { tag: "#convotalk", count: 1 },
                ]}
            />,
        );

        expect(screen.getByText("#webrtc")).toBeInTheDocument();
        expect(screen.getByText("2 publicações")).toBeInTheDocument();
        expect(screen.getByText("#convotalk")).toBeInTheDocument();
        expect(screen.getByText("1 publicação")).toBeInTheDocument();
    });

    it("mostra estado vazio sem tópicos", () => {
        render(<TrendingTopics topics={[]} />);

        expect(
            screen.getByText("Nenhum tópico em alta nos últimos dias."),
        ).toBeInTheDocument();
    });

    it("permite tentar novamente após erro", () => {
        const onRetry = vi.fn();
        render(
            <TrendingTopics
                topics={[]}
                error="Erro ao carregar."
                onRetry={onRetry}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );
        expect(onRetry).toHaveBeenCalled();
    });
});
