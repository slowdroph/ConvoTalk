import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import type { MouseEventHandler, ReactNode } from "react";

interface DropdownTriggerProps {
    onClick: MouseEventHandler;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
}

interface DropdownMenuProps {
    trigger: (props: DropdownTriggerProps) => ReactNode;
    children: ReactNode;
    align?: "left" | "right";
    className?: string;
    onClose?: () => void;
}

interface MenuPosition {
    top: number;
    left: number;
}

const VIEWPORT_MARGIN = 12;
const TRIGGER_OFFSET = 8;

export default function DropdownMenu({
    trigger,
    children,
    align = "right",
    className = "",
    onClose,
}: DropdownMenuProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<MenuPosition | null>(null);
    const anchorRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelId = useId();

    const updatePosition = useCallback(() => {
        const anchor = anchorRef.current;
        const panel = panelRef.current;
        if (!anchor || !panel) return;

        const anchorRect = anchor.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const { width, height } = panelRect;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxLeft = Math.max(
            VIEWPORT_MARGIN,
            viewportWidth - width - VIEWPORT_MARGIN,
        );
        const maxTop = Math.max(
            VIEWPORT_MARGIN,
            viewportHeight - height - VIEWPORT_MARGIN,
        );

        let left =
            align === "left" ? anchorRect.left : anchorRect.right - width;
        left = Math.min(Math.max(VIEWPORT_MARGIN, left), maxLeft);

        let top = anchorRect.bottom + TRIGGER_OFFSET;
        if (top + height > viewportHeight - VIEWPORT_MARGIN) {
            const above = anchorRect.top - height - TRIGGER_OFFSET;
            top =
                above >= VIEWPORT_MARGIN
                    ? above
                    : Math.min(Math.max(VIEWPORT_MARGIN, top), maxTop);
        }
        top = Math.min(Math.max(VIEWPORT_MARGIN, top), maxTop);

        setPosition((current) =>
            current && current.top === top && current.left === left
                ? current
                : { top, left },
        );
    }, [align]);

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (
                anchorRef.current?.contains(target) ||
                panelRef.current?.contains(target)
            ) {
                return;
            }
            setOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", updatePosition);
        document.addEventListener("scroll", updatePosition, true);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", updatePosition);
            document.removeEventListener("scroll", updatePosition, true);
        };
    }, [open, updatePosition]);

    const closeMenu = () => {
        setOpen(false);
        onClose?.();
    };

    const toggle = () => {
        if (open) {
            setOpen(false);
            return;
        }
        setPosition(null);
        setOpen(true);
    };

    return (
        <div ref={anchorRef} className="relative flex items-center">
            {trigger({
                onClick: toggle,
                "aria-haspopup": "menu",
                "aria-expanded": open,
                "aria-controls": panelId,
            })}
            {open &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={panelRef}
                        id={panelId}
                        role="menu"
                        onClick={closeMenu}
                        style={{
                            top: position?.top ?? 0,
                            left: position?.left ?? 0,
                            visibility: position ? "visible" : "hidden",
                        }}
                        className={`fixed z-[100] w-64 max-w-[calc(100vw-1.5rem)] max-h-[70vh] overflow-y-auto custom-scrollbar rounded-2xl bg-noir-surface-alt/95 backdrop-blur-md border border-noir-border shadow-2xl p-1.5 animate-popIn ${className}`}
                    >
                        {children}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
