import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import UserProfilePopover from "../../components/ui/UserProfilePopover";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

function renderPopover() {
    return render(
        <UserProfilePopover
            userId="u1"
            name="Ana"
            avatar=""
            email="ana@test.com"
            status="em reunião"
            isOnline={true}
        >
            <span>Ana</span>
        </UserProfilePopover>,
    );
}

function hover(target: HTMLElement) {
    fireEvent.mouseEnter(target);
    act(() => {
        vi.advanceTimersByTime(400);
    });
}

describe("UserProfilePopover", () => {
    it("renderiza o conteúdo filho normalmente", () => {
        renderPopover();
        expect(screen.getByText("Ana")).toBeInTheDocument();
        expect(screen.queryByText("em reunião")).not.toBeInTheDocument();
    });

    it("abre o popover após o delay de hover", () => {
        renderPopover();
        hover(screen.getByText("Ana"));
        expect(screen.getByText("em reunião")).toBeInTheDocument();
        expect(screen.getByText("Online")).toBeInTheDocument();
    });

    it("não abre popover quando falta userId ou name", () => {
        render(
            <UserProfilePopover name="">
                <span>filho</span>
            </UserProfilePopover>,
        );
        expect(screen.getByText("filho")).toBeInTheDocument();
        expect(screen.queryByText("Online")).not.toBeInTheDocument();
    });

    it("mostra status offline quando não online", () => {
        render(
            <UserProfilePopover userId="u2" name="Bruno" isOnline={false}>
                <span>Bruno</span>
            </UserProfilePopover>,
        );
        hover(screen.getByText("Bruno"));
        expect(screen.getByText("Offline")).toBeInTheDocument();
    });
});
