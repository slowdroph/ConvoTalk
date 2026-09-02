import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "../../types";

interface MentionAutocompleteProps {
    isOpen: boolean;
    participants: User[];
    currentUserId: string;
    query: string;
    onSelect: (user: User) => void;
    onClose: () => void;
    position?: { left: number; top: number };
}

export default function MentionAutocomplete({
    isOpen,
    participants,
    currentUserId,
    query,
    onSelect,
    onClose,
    position,
}: MentionAutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLUListElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!isOpen || !query) return [];

        const lowerQuery = query.toLowerCase();
        return participants
            .filter(
                (p) =>
                    p._id !== currentUserId &&
                    p.name.toLowerCase().startsWith(lowerQuery),
            )
            .slice(0, 8);
    }, [isOpen, query, participants, currentUserId]);

    const safeIndex = filtered.length > 0
        ? Math.min(selectedIndex, filtered.length - 1)
        : 0;

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) =>
                    i < filtered.length - 1 ? i + 1 : 0,
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) =>
                    i > 0 ? i - 1 : filtered.length - 1,
                );
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (filtered[safeIndex]) {
                    onSelect(filtered[safeIndex]);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, filtered, safeIndex, onClose, onSelect]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (listRef.current && filtered[safeIndex]) {
            const option = listRef.current.children[safeIndex] as HTMLElement;
            option?.scrollIntoView({ block: "nearest" });
        }
    }, [safeIndex, filtered]);

    if (!isOpen || filtered.length === 0) return null;

    const activeDescendantId = filtered[safeIndex]
        ? `mention-option-${filtered[safeIndex]._id}`
        : undefined;

    return (
        <div
            ref={containerRef}
            className="fixed z-50 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto w-64"
            style={{
                left: position ? position.left + 4 : 0,
                top: position ? position.top - 200 : 0,
            }}
            role="listbox"
            aria-label="Sugestões de menção"
            aria-activedescendant={activeDescendantId}
        >
            <ul ref={listRef} className="py-1">
                {filtered.map((user, i) => (
                    <li
                        key={user._id}
                        id={`mention-option-${user._id}`}
                        role="option"
                        aria-selected={i === safeIndex}
                        className={`px-3 py-2 flex items-center gap-2 cursor-pointer ${
                            i === safeIndex
                                ? "bg-emerald-50 dark:bg-emerald-900/30"
                                : "hover:bg-slate-50 dark:hover:bg-zinc-700/50"
                        }`}
                        onClick={() => onSelect(user)}
                        onMouseEnter={() => setSelectedIndex(i)}
                    >
                        <div
                            className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-medium shrink-0"
                            style={{
                                backgroundImage: user.avatar
                                    ? `url(${user.avatar})`
                                    : undefined,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            {!user.avatar && user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                                {user.email}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}