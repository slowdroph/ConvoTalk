import { useCallback, useRef, useState } from "react";

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longFiredRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

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
      clearTimer();
      timerRef.current = setTimeout(() => {
        longFiredRef.current = true;
        onLongPress?.();
      }, longPressMs);
    },
    [disabled, onLongPress, longPressMs],
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
        const clamped = Math.max(-swipeThreshold * 2, Math.min(swipeThreshold * 2, dx));
        offsetRef.current = clamped;
        setOffset(clamped);
        setDragging(true);
      }
    },
    [swipeThreshold],
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
    startRef.current = null;
    offsetRef.current = 0;
    setOffset(0);
    setDragging(false);
  }, [onSwipeLeft, onSwipeRight, swipeThreshold]);

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
