import { useEffect, useRef, useState, useCallback } from "react";

interface Position {
    top: number;
    left: number;
    width: number;
}

export function useMessageActionsPosition(
    bubbleRef: React.RefObject<HTMLDivElement | null>,
    isOpen: boolean,
): Position | null {
    const [position, setPosition] = useState<Position | null>(null);
    const rafRef = useRef<number | null>(null);

    const updatePosition = useCallback(() => {
        const bubble = bubbleRef.current;
        if (!bubble) {
            setPosition(null);
            return;
        }
        const rect = bubble.getBoundingClientRect();
        setPosition({
            top: rect.bottom + 8,
            left: rect.left + rect.width / 2,
            width: rect.width,
        });
    }, [bubbleRef]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        updatePosition();

        const handleScroll = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updatePosition);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isOpen, bubbleRef, updatePosition]);

    // Clear position when closed
    useEffect(() => {
        if (!isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPosition(null);
        }
    }, [isOpen]);

    return position;
}
