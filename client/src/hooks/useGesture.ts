import { useCallback, useEffect, useRef, useState } from "react";

interface UseGestureOptions {
    onLongPress?: () => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    disabled?: boolean;
    longPressMs?: number;
    swipeThreshold?: number;
}

export interface GestureHandlers {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
}

export function useGesture({
    onLongPress,
    onSwipeLeft,
    onSwipeRight,
    disabled = false,
    longPressMs = 500,
    swipeThreshold = 60,
}: UseGestureOptions): {
    handlers: GestureHandlers;
    offset: number;
    dragging: boolean;
} {
    const startRef = useRef<{ x: number; y: number; id: number } | null>(null);
    const offsetRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const longFiredRef = useRef(false);
    const draggingRef = useRef(false);
    const rafRef = useRef(0);
    const pendingOffsetRef = useRef<number | null>(null);
    const [offset, setOffset] = useState(0);
    const [dragging, setDragging] = useState(false);

    const flushOffset = useCallback(() => {
        rafRef.current = 0;
        if (pendingOffsetRef.current === null) return;
        const next = pendingOffsetRef.current;
        pendingOffsetRef.current = null;
        setOffset((prev) => (prev === next ? prev : next));
    }, []);

    const scheduleOffset = useCallback(
        (next: number) => {
            pendingOffsetRef.current = next;
            if (rafRef.current !== 0) return;
            rafRef.current = requestAnimationFrame(flushOffset);
        },
        [flushOffset],
    );

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
    }, []);

    const cancelScheduledOffset = useCallback(() => {
        if (rafRef.current !== 0) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
        }
        pendingOffsetRef.current = null;
    }, []);

    const onTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (disabled) return;
            const touch = e.touches[0];
            startRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                id: touch.identifier,
            };
            offsetRef.current = 0;
            longFiredRef.current = false;
            cancelScheduledOffset();
            if (draggingRef.current) {
                draggingRef.current = false;
                setDragging(false);
            }
            setOffset((prev) => (prev === 0 ? prev : 0));
            clearTimer();
            timerRef.current = setTimeout(() => {
                longFiredRef.current = true;
                onLongPress?.();
            }, longPressMs);
        },
        [disabled, onLongPress, longPressMs, clearTimer, cancelScheduledOffset],
    );

    const onTouchMove = useCallback(
        (e: React.TouchEvent) => {
            const start = startRef.current;
            if (!start) return;
            const touch = Array.from(e.touches).find(
                (t) => t.identifier === start.id,
            );
            if (!touch) return;
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
                clearTimer();
            }
            if (Math.abs(dx) > Math.abs(dy)) {
                const clamped = Math.max(
                    -swipeThreshold * 2,
                    Math.min(swipeThreshold * 2, dx),
                );
                offsetRef.current = clamped;
                if (!draggingRef.current) {
                    draggingRef.current = true;
                    setDragging(true);
                }
                scheduleOffset(clamped);
            }
        },
        [swipeThreshold, clearTimer, scheduleOffset],
    );

    const onTouchEnd = useCallback(() => {
        const didLongPress = longFiredRef.current;
        const finalOffset = offsetRef.current;
        const start = startRef.current;
        if (!didLongPress && start && Math.abs(finalOffset) >= swipeThreshold) {
            if (finalOffset > 0) {
                onSwipeRight?.();
            } else {
                onSwipeLeft?.();
            }
        }
        clearTimer();
        cancelScheduledOffset();
        startRef.current = null;
        offsetRef.current = 0;
        if (draggingRef.current) {
            draggingRef.current = false;
            setDragging(false);
        }
        setOffset((prev) => (prev === 0 ? prev : 0));
    }, [
        onSwipeLeft,
        onSwipeRight,
        swipeThreshold,
        clearTimer,
        cancelScheduledOffset,
    ]);

    useEffect(() => {
        const timerId = timerRef;
        const rafId = rafRef;
        const pending = pendingOffsetRef;
        return () => {
            if (timerId.current) {
                clearTimeout(timerId.current);
                timerId.current = undefined;
            }
            if (rafId.current !== 0) {
                cancelAnimationFrame(rafId.current);
                rafId.current = 0;
            }
            pending.current = null;
        };
    }, []);

    return {
        handlers: {
            onTouchStart,
            onTouchMove,
            onTouchEnd,
            onTouchCancel: onTouchEnd,
        },
        offset,
        dragging,
    };
}
