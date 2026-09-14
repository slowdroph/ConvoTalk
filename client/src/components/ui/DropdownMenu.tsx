import { useEffect, useRef, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";

interface DropdownTriggerProps {
    onClick: MouseEventHandler;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
}

interface DropdownMenuProps {
    trigger: (props: DropdownTriggerProps) => ReactNode;
    children: ReactNode;
    align?: "left" | "right";
    className?: string;
    onClose?: () => void;
}

export default function DropdownMenu({
    trigger,
    children,
    align = "right",
    className = "",
    onClose,
}: DropdownMenuProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: PointerEvent) => {
            if (
                wrapRef.current &&
                !wrapRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const closeMenu = () => {
        setOpen(false);
        onClose?.();
    };

    return (
        <div ref={wrapRef} className="relative">
            {trigger({
                onClick: () => setOpen((prev) => !prev),
                "aria-haspopup": "menu",
                "aria-expanded": open,
            })}
            {open && (
                <div
                    className={`absolute top-full mt-2 z-50 w-64 rounded-2xl bg-noir-surface-alt/95 backdrop-blur-md border border-noir-border shadow-2xl p-1.5 ${
                        align === "right" ? "right-0" : "left-0"
                    } ${className}`}
                    onClick={closeMenu}
                    role="menu"
                >
                    {children}
                </div>
            )}
        </div>
    );
}
