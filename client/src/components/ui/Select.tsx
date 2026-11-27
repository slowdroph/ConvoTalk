import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { KeyboardEvent } from "react";
import { filterOptions } from "../../utils/options";

export interface SelectOption {
    value: string;
    label: string;
    emoji?: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    id?: string;
    placeholder?: string;
    disabled?: boolean;
    ariaLabel?: string;
    size?: "md" | "sm";
    tone?: "default" | "onDark";
    fullWidth?: boolean;
    className?: string;
}

const VIEWPORT_MARGIN = 12;
const TRIGGER_OFFSET = 8;
const SEARCH_THRESHOLD = 8;
const CLOSE_ANIMATION_MS = 150;

const sizeClasses: Record<NonNullable<SelectProps["size"]>, string> = {
    md: "rounded-xl px-3 py-2 text-xs",
    sm: "rounded-lg px-2 py-1 text-xs",
};

const toneTriggerClasses: Record<NonNullable<SelectProps["tone"]>, string> = {
    default:
        "border-slate-200 bg-white text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-bright",
    onDark:
        "border-white/10 bg-[#131c13]/90 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60",
};

const tonePanelClasses: Record<NonNullable<SelectProps["tone"]>, string> = {
    default:
        "border-slate-200 bg-white text-slate-700 dark:border-noir-border dark:bg-noir-surface dark:text-noir-text-bright",
    onDark: "border-white/10 bg-[#131c13] text-zinc-200",
};

const toneOptionHoverClasses: Record<
    NonNullable<SelectProps["tone"]>,
    string
> = {
    default: "hover:bg-slate-50 dark:hover:bg-noir-surface-alt",
    onDark: "hover:bg-white/5",
};

const toneOptionSelectedClasses: Record<
    NonNullable<SelectProps["tone"]>,
    string
> = {
    default: "text-emerald-700 dark:text-emerald-400",
    onDark: "text-emerald-400",
};

const toneSearchClasses: Record<NonNullable<SelectProps["tone"]>, string> = {
    default:
        "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 dark:border-noir-border dark:bg-noir-surface-alt/60 dark:text-noir-text-bright dark:placeholder:text-noir-text-muted/70",
    onDark:
        "border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-emerald-500/60",
};

export default function Select({
    value,
    onChange,
    options,
    id,
    placeholder,
    disabled = false,
    ariaLabel,
    size = "md",
    tone = "default",
    fullWidth = true,
    className = "",
}: SelectProps) {
    const { t } = useTranslation("common");
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const [query, setQuery] = useState("");
    const [position, setPosition] = useState<{ top: number; left: number } | null>(
        null,
    );
    const [highlighted, setHighlighted] = useState(0);
    const anchorRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<number | null>(null);
    const panelId = useId();
    const optionIdPrefix = useId();

    const showSearch = options.length > SEARCH_THRESHOLD;
    const visibleOptions = useMemo(
        () => (showSearch ? filterOptions(options, query) : options),
        [options, query, showSearch],
    );

    const selectedOption = options.find((option) => option.value === value);

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

        let left = anchorRect.left;
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
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open, updatePosition, visibleOptions.length]);

    useEffect(() => {
        if (open) panelRef.current?.focus({ preventScroll: true });
    }, [open]);

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
            setClosing(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("resize", updatePosition);
        document.addEventListener("scroll", updatePosition, true);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("resize", updatePosition);
            document.removeEventListener("scroll", updatePosition, true);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        document
            .getElementById(`${optionIdPrefix}-${highlighted}`)
            ?.scrollIntoView?.({ block: "nearest" });
    }, [open, highlighted, optionIdPrefix]);

    useEffect(
        () => () => {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
            }
        },
        [],
    );

    const openMenu = (preferLast = false) => {
        if (disabled || options.length === 0) return;
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setClosing(false);
        setQuery("");
        const selected = options.findIndex((option) => option.value === value);
        const target =
            selected >= 0
                ? selected
                : preferLast
                  ? options.length - 1
                  : 0;
        setHighlighted(Math.max(0, target));
        setPosition(null);
        setOpen(true);
    };

    const requestClose = (restoreFocus = true) => {
        if (!open || closing) return;
        setClosing(true);
        if (restoreFocus) triggerRef.current?.focus();
        closeTimerRef.current = window.setTimeout(() => {
            setOpen(false);
            setClosing(false);
            setQuery("");
            closeTimerRef.current = null;
        }, CLOSE_ANIMATION_MS);
    };

    const selectOption = (index: number) => {
        const option = visibleOptions[index];
        if (!option) return;
        onChange(option.value);
        requestClose();
    };

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            openMenu();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(true);
        }
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            event.stopPropagation();
            panelRef.current?.focus();
        }
    };

    const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlighted((current) =>
                Math.min(current + 1, visibleOptions.length - 1),
            );
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlighted((current) => Math.max(current - 1, 0));
        } else if (event.key === "Home") {
            event.preventDefault();
            setHighlighted(0);
        } else if (event.key === "End") {
            event.preventDefault();
            setHighlighted(visibleOptions.length - 1);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectOption(highlighted);
        } else if (event.key === "Escape") {
            event.preventDefault();
            requestClose();
        } else if (event.key === "Tab") {
            setOpen(false);
            setClosing(false);
        }
    };

    return (
        <div ref={anchorRef} className="relative">
            <button
                ref={triggerRef}
                id={id}
                type="button"
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() =>
                    open ? requestClose(false) : openMenu()
                }
                onKeyDown={handleTriggerKeyDown}
                className={`flex items-center justify-between gap-2 border outline-none transition-colors ${
                    fullWidth ? "w-full" : ""
                } ${sizeClasses[size]} ${toneTriggerClasses[tone]} ${className}`}
            >
                <span
                    className={`min-w-0 flex-1 truncate text-left ${
                        selectedOption ? "" : "opacity-60"
                    }`}
                >
                    {selectedOption
                        ? `${selectedOption.emoji ? `${selectedOption.emoji} ` : ""}${selectedOption.label}`
                        : (placeholder ?? "")}
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        open && !closing ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {open &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={panelRef}
                        id={panelId}
                        role="listbox"
                        tabIndex={-1}
                        aria-activedescendant={`${optionIdPrefix}-${highlighted}`}
                        onKeyDown={handlePanelKeyDown}
                        style={{
                            top: position?.top ?? 0,
                            left: position?.left ?? 0,
                            visibility: position ? "visible" : "hidden",
                        }}
                        className={`fixed z-[100] min-w-40 max-h-[70vh] overflow-y-auto custom-scrollbar rounded-xl border p-1.5 shadow-2xl outline-none ${
                            closing
                                ? "animate-popOut pointer-events-none"
                                : "animate-popIn"
                        } ${tonePanelClasses[tone]}`}
                    >
                        {showSearch && (
                            <div className="px-1 pb-1.5">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setHighlighted(0);
                                    }}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder={t("select.search")}
                                    aria-label={t("select.search")}
                                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-colors ${toneSearchClasses[tone]}`}
                                />
                            </div>
                        )}
                        {visibleOptions.length === 0 ? (
                            <p
                                className={`px-2.5 py-2 text-xs ${
                                    tone === "onDark"
                                        ? "text-zinc-500"
                                        : "text-slate-400 dark:text-noir-text-muted"
                                }`}
                            >
                                {t("select.noResults")}
                            </p>
                        ) : (
                            visibleOptions.map((option, index) => {
                                const isSelected = option.value === value;
                                const isHighlighted = index === highlighted;
                                return (
                                    <div
                                        key={option.value}
                                        id={`${optionIdPrefix}-${index}`}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => selectOption(index)}
                                        onMouseMove={() =>
                                            setHighlighted(index)
                                        }
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                                            isHighlighted
                                                ? toneOptionHoverClasses[tone]
                                                : ""
                                        } ${
                                            isSelected
                                                ? toneOptionSelectedClasses[tone]
                                                : ""
                                        }`}
                                    >
                                        <span className="min-w-0 flex-1 truncate">
                                            {option.emoji ? (
                                                <span
                                                    aria-hidden="true"
                                                    className="mr-1"
                                                >
                                                    {option.emoji}
                                                </span>
                                            ) : null}
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-3.5 w-3.5 shrink-0"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>,
                    document.body,
                )}
        </div>
    );
}