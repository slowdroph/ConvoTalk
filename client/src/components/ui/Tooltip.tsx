import {
    cloneElement,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
    content: ReactNode;
    children: ReactElement;
    side?: TooltipSide;
    delay?: number;
    disabled?: boolean;
    className?: string;
}

interface Position {
    top: number;
    left: number;
}

const GAP = 8;
const VIEWPORT_MARGIN = 8;

const oppositeSide: Record<TooltipSide, TooltipSide> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
};

export default function Tooltip({
    content,
    children,
    side = "top",
    delay = 300,
    disabled = false,
    className = "",
}: TooltipProps) {
    const tooltipId = useId();
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<Position | null>(null);
    const [isTouch] = useState(
        () =>
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(hover: none)").matches,
    );
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pointerDownRef = useRef(false);

    const hasContent =
        content !== null && content !== undefined && content !== "";

    const clearShowTimer = useCallback(() => {
        if (showTimerRef.current !== null) {
            clearTimeout(showTimerRef.current);
            showTimerRef.current = null;
        }
    }, []);

    const openTooltip = useCallback(() => {
        clearShowTimer();
        if (disabled || !hasContent) return;
        setOpen(true);
    }, [clearShowTimer, disabled, hasContent]);

    const scheduleOpen = useCallback(() => {
        if (disabled || !hasContent) return;
        clearShowTimer();
        showTimerRef.current = setTimeout(() => {
            showTimerRef.current = null;
            setOpen(true);
        }, delay);
    }, [clearShowTimer, delay, disabled, hasContent]);

    const closeTooltip = useCallback(() => {
        clearShowTimer();
        setOpen(false);
    }, [clearShowTimer]);

    useEffect(() => {
        return () => {
            clearShowTimer();
        };
    }, [clearShowTimer]);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        const tooltip = tooltipRef.current;
        if (!trigger || !tooltip) return;

        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const space = {
            top: triggerRect.top,
            bottom: viewportHeight - triggerRect.bottom,
            left: triggerRect.left,
            right: viewportWidth - triggerRect.right,
        };

        const needed =
            side === "top" || side === "bottom"
                ? tooltipRect.height + GAP + VIEWPORT_MARGIN
                : tooltipRect.width + GAP + VIEWPORT_MARGIN;

        let resolvedSide = side;
        if (space[side] < needed && space[oppositeSide[side]] >= needed) {
            resolvedSide = oppositeSide[side];
        }

        let top: number;
        let left: number;

        if (resolvedSide === "top" || resolvedSide === "bottom") {
            top =
                resolvedSide === "top"
                    ? triggerRect.top - tooltipRect.height - GAP
                    : triggerRect.bottom + GAP;
            left =
                triggerRect.left +
                triggerRect.width / 2 -
                tooltipRect.width / 2;
        } else {
            left =
                resolvedSide === "left"
                    ? triggerRect.left - tooltipRect.width - GAP
                    : triggerRect.right + GAP;
            top =
                triggerRect.top +
                triggerRect.height / 2 -
                tooltipRect.height / 2;
        }

        const maxLeft = Math.max(
            VIEWPORT_MARGIN,
            viewportWidth - tooltipRect.width - VIEWPORT_MARGIN,
        );
        const maxTop = Math.max(
            VIEWPORT_MARGIN,
            viewportHeight - tooltipRect.height - VIEWPORT_MARGIN,
        );

        setPosition({
            top: Math.min(Math.max(top, VIEWPORT_MARGIN), maxTop),
            left: Math.min(Math.max(left, VIEWPORT_MARGIN), maxLeft),
        });
    }, [side]);

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };
        const handleReflow = () => updatePosition();

        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("scroll", handleReflow, true);
        window.addEventListener("resize", handleReflow);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("scroll", handleReflow, true);
            window.removeEventListener("resize", handleReflow);
        };
    }, [open, updatePosition]);

    const handlePointerDown = () => {
        pointerDownRef.current = true;
        closeTooltip();
        window.setTimeout(() => {
            pointerDownRef.current = false;
        }, 0);
    };

    const handleFocus = () => {
        if (pointerDownRef.current) return;
        openTooltip();
    };

    const child = children as ReactElement<{
        "aria-describedby"?: string;
    }>;
    const describedBy =
        [child.props["aria-describedby"], open ? tooltipId : undefined]
            .filter(Boolean)
            .join(" ") || undefined;

    const trigger = cloneElement(child, {
        "aria-describedby": describedBy,
    });

    return (
        <>
            <span
                ref={triggerRef}
                className="inline-flex shrink-0"
                onMouseEnter={isTouch ? undefined : scheduleOpen}
                onMouseLeave={isTouch ? undefined : closeTooltip}
                onFocus={handleFocus}
                onBlur={closeTooltip}
                onPointerDown={handlePointerDown}
            >
                {trigger}
            </span>
            {open &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        id={tooltipId}
                        role="tooltip"
                        style={{
                            top: position?.top ?? 0,
                            left: position?.left ?? 0,
                            visibility: position ? "visible" : "hidden",
                        }}
                        className={`pointer-events-none fixed z-[120] max-w-[min(18rem,calc(100vw-1rem))] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium leading-snug text-slate-700 shadow-lg animate-[tooltip-in_120ms_ease-out] motion-reduce:animate-none dark:border-noir-border dark:bg-noir-card dark:text-noir-text-bright ${className}`.trim()}
                    >
                        {content}
                    </div>,
                    document.body,
                )}
        </>
    );
}
