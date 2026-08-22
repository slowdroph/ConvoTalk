import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext, type Toast } from "../contexts/ToastContext";

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (toast: Omit<Toast, "id">) => {
            const id = nextId.current;
            nextId.current += 1;
            setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
            setTimeout(() => dismiss(id), DEFAULT_DURATION);
        },
        [dismiss],
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-100 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm ${
                            toast.type === "error"
                                ? "bg-red-900/90 border-red-700 text-red-50"
                                : toast.type === "success"
                                  ? "bg-green-900/90 border-green-700 text-green-50"
                                  : "bg-zinc-800/95 border-zinc-600 text-zinc-50"
                        }`}
                    >
                        <div className="flex-1 min-w-0">
                            {toast.title && (
                                <p className="font-semibold truncate">
                                    {toast.title}
                                </p>
                            )}
                            <p className="wrap-break-word">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
                            aria-label="Fechar notificação"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
