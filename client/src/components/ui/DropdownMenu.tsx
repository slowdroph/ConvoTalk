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

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
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
                    className={`absolute top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg min-w-40 dark:bg-zinc-800 dark:border-zinc-700 ${
                        align === "right" ? "right-0" : "left-0"
                    } ${className}`}
                    onClick={closeMenu}
                >
                    {children}
                </div>
            )}
        </div>
    );
}