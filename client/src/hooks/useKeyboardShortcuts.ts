import { useEffect } from "react";

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

export function useKeyboardShortcuts(bindings: ShortcutBinding[]): void {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTyping =
                !!target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable);

            for (const binding of bindings) {
                if (binding.enabled === false) continue;
                if (!matchesBinding(e, binding)) continue;

                const usesModifier =
                    binding.ctrl || binding.meta || binding.alt;
                if (isTyping && !usesModifier) continue;

                binding.handler(e);
                return;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [bindings]);
}
