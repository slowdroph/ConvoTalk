import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import Avatar from "./Avatar";
import { formatLastSeen } from "../../utils/formatLastSeen";

interface UserProfilePopoverProps {
    children: ReactNode;
    userId?: string;
    name?: string;
    avatar?: string;
    email?: string;
    status?: string;
    isOnline?: boolean;
    lastSeen?: string | null;
}

export default function UserProfilePopover({
    children,
    userId,
    name,
    avatar,
    email,
    status,
    isOnline,
    lastSeen,
}: UserProfilePopoverProps) {
    const [open, setOpen] = useState(false);
    const [isTouch] = useState<boolean>(() =>
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: none)").matches,
    );
    const wrapRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        if (!open || !isTouch) return;
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (
                wrapRef.current &&
                !wrapRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [open, isTouch]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const openAfterDelay = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setOpen(true), 350);
    };

    const closeAfterDelay = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setOpen(false), 120);
    };

    if (!userId || !name) {
        return <>{children}</>;
    }

    return (
        <div
            ref={wrapRef}
            className="relative inline-flex gap-2.5"
            onMouseEnter={isTouch ? undefined : openAfterDelay}
            onMouseLeave={isTouch ? undefined : closeAfterDelay}
            onClick={() => {
                if (isTouch) setOpen((v) => !v);
            }}
        >
            {children}
            {open && (
                <div
                    className="absolute z-50"
                    onMouseEnter={() => {
                        if (timerRef.current) clearTimeout(timerRef.current);
                        setOpen(true);
                    }}
                    onMouseLeave={closeAfterDelay}
                >
                    <div className="mt-1 ml-1 w-56 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Avatar src={avatar} name={name} size="md" />
                            <div className="min-w-0">
                                <p className="text-white font-semibold text-sm truncate">
                                    {name}
                                </p>
                                {email && (
                                    <p className="text-zinc-500 text-xs truncate">
                                        {email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1 text-xs">
                            <p
                                className={
                                    isOnline
                                        ? "text-green-400"
                                        : "text-zinc-500"
                                }
                            >
                                {isOnline
                                    ? "Online"
                                    : lastSeen
                                      ? formatLastSeen(lastSeen)
                                      : "Offline"}
                            </p>
                            {status && (
                                <p className="text-zinc-400 truncate">
                                    {status}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
