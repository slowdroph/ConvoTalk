import { useEffect, useId, useRef, useState } from "react";
import { useCitySuggestions } from "../../hooks/useCitySuggestions";

interface CityComboboxProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    country?: string | null;
    maxLength?: number;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const DEFAULT_INPUT_CLASS =
    "w-full bg-noir-surface-alt border border-noir-border rounded-xl px-3.5 py-2.5 text-sm text-noir-text-bright placeholder-noir-text-muted focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition";

export default function CityCombobox({
    id,
    value,
    onChange,
    country,
    maxLength = 80,
    placeholder,
    className = DEFAULT_INPUT_CLASS,
    disabled = false,
}: CityComboboxProps) {
    const { suggestions, loading } = useCitySuggestions(country, value);
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(-1);
    const wrapRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (e: PointerEvent) => {
            if (
                wrapRef.current &&
                !wrapRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setHighlight(-1);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [open]);

    const trimmed = value.trim();
    const visible = open && (suggestions.length > 0 || (loading && trimmed.length > 0));

    const select = (name: string) => {
        onChange(name);
        setOpen(false);
        setHighlight(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            if (suggestions.length === 0) return;
            e.preventDefault();
            setOpen(true);
            setHighlight((prev) => {
                const last = suggestions.length - 1;
                if (e.key === "ArrowDown") {
                    return prev >= last ? 0 : prev + 1;
                }
                return prev <= 0 ? last : prev - 1;
            });
            return;
        }

        if (e.key === "Enter") {
            if (highlight >= 0 && highlight < suggestions.length) {
                e.preventDefault();
                select(suggestions[highlight]);
            }
            return;
        }

        if (e.key === "Escape") {
            setOpen(false);
            setHighlight(-1);
        }
    };

    return (
        <div ref={wrapRef} className="relative">
            <input
                type="text"
                id={id}
                role="combobox"
                aria-expanded={visible}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                    visible && highlight >= 0 && highlight < suggestions.length
                        ? `${listId}-option-${highlight}`
                        : undefined
                }
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                    setHighlight(-1);
                }}
                onFocus={() => setOpen(true)}
                onBlur={(e) => {
                    // Seleção por clique usa mousedown+preventDefault (sem blur);
                    // aqui o foco realmente saiu do combobox (Tab/clique externo).
                    if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
                        setOpen(false);
                        setHighlight(-1);
                    }
                }}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
                className={className}
            />
            {visible && (
                <ul
                    id={listId}
                    role="listbox"
                    aria-label="Sugestões de cidades"
                    className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-noir-border bg-noir-surface-alt shadow-2xl py-1 text-sm"
                >
                    {loading && suggestions.length === 0 && (
                        <li
                            role="option"
                            aria-disabled="true"
                            aria-selected="false"
                            className="px-3.5 py-2 text-noir-text-muted italic"
                        >
                            Buscando cidades…
                        </li>
                    )}
                    {suggestions.map((name, index) => (
                        <li
                            key={name}
                            id={`${listId}-option-${index}`}
                            role="option"
                            aria-selected={index === highlight}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                select(name);
                            }}
                            onMouseEnter={() => setHighlight(index)}
                            className={`px-3.5 py-2 cursor-pointer ${
                                index === highlight
                                    ? "bg-noir-card text-noir-text-bright"
                                    : "text-noir-text"
                            }`}
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
