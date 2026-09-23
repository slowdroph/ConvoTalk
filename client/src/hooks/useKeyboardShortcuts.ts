import { useEffect, useRef } from "react";

export interface ShortcutBinding {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    alt?: boolean;
    shift?: boolean;
    handler: (e: KeyboardEvent) => void;
    enabled?: boolean;
}

function matchesBinding(e: KeyboardEvent, binding: ShortcutBinding): boolean {
    const key = binding.key.toLowerCase();
    const pressed = e.key.toLowerCase();
    if (pressed !== key) return false;
    if (binding.ctrl !== undefined && e.ctrlKey !== binding.ctrl) return false;
    if (binding.meta !== undefined && e.metaKey !== binding.meta) return false;
    if (binding.alt !== undefined && e.altKey !== binding.alt) return false;
    if (binding.shift !== undefined && e.shiftKey !== binding.shift) {
        return false;
    }
    return true;
}

type BindingsSource = { getBindings: () => ShortcutBinding[] };

const subscribers = new Set<BindingsSource>();
let listening = false;

function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return (
        !!el &&
        (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.isContentEditable)
    );
}

function handleGlobalKeyDown(e: KeyboardEvent): void {
    const isTyping = isTypingTarget(e.target);

    for (const sub of subscribers) {
        const bindings = sub.getBindings();
        for (const binding of bindings) {
            if (binding.enabled === false) continue;
            if (!matchesBinding(e, binding)) continue;

            const usesModifier =
                binding.ctrl || binding.meta || binding.alt;
            if (isTyping && !usesModifier) continue;

            binding.handler(e);
            break;
        }
    }
}

function ensureListening(): void {
    if (!listening && typeof window !== "undefined") {
        window.addEventListener("keydown", handleGlobalKeyDown);
        listening = true;
    }
}

function releaseIfIdle(): void {
    if (listening && subscribers.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("keydown", handleGlobalKeyDown);
        listening = false;
    }
}

export function useKeyboardShortcuts(bindings: ShortcutBinding[]): void {
    const bindingsRef = useRef(bindings);

    useEffect(() => {
        bindingsRef.current = bindings;
    });

    useEffect(() => {
        const source: BindingsSource = {
            getBindings: () => bindingsRef.current,
        };
        subscribers.add(source);
        ensureListening();
        return () => {
            subscribers.delete(source);
            releaseIfIdle();
        };
    }, []);
}
