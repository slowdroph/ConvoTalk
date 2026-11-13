import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Attachment } from "../../../types";

interface PostImageProps {
    image: Attachment;
}

export default function PostImage({ image }: PostImageProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;

        const previousFocus =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        const trigger = triggerRef.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                return;
            }
            if (event.key === "Tab") {
                event.preventDefault();
                closeRef.current?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            (previousFocus ?? trigger)?.focus();
        };
    }, [open]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Ampliar imagem ${image.filename}`}
                className="mt-3 block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-opacity hover:opacity-95 dark:border-noir-border dark:bg-noir-surface-alt"
            >
                <img
                    src={image.url}
                    alt={image.filename}
                    loading="lazy"
                    className="max-h-[520px] w-full object-cover"
                />
            </button>

            {open &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setOpen(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Imagem ${image.filename}`}
                    >
                        <button
                            ref={closeRef}
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Fechar imagem"
                            className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
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
                        <img
                            src={image.url}
                            alt={image.filename}
                            className="max-h-full max-w-full rounded-lg object-contain"
                            onClick={(event) => event.stopPropagation()}
                        />
                    </div>,
                    document.body,
                )}
        </>
    );
}
