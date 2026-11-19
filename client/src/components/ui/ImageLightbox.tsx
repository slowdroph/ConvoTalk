import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
    src: string;
    alt: string;
    className?: string;
    imageClassName?: string;
    triggerLabel?: string;
    children?: ReactNode;
}

export default function ImageLightbox({
    src,
    alt,
    className,
    imageClassName,
    triggerLabel,
    children,
}: ImageLightboxProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;

        const previousFocus =
            document.activeElement instanceof HTMLElement &&
            document.activeElement !== document.body
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
                aria-label={triggerLabel ?? `Ampliar imagem ${alt}`}
                className={className}
            >
                {children ?? (
                    <img
                        src={src}
                        alt={alt}
                        loading="lazy"
                        className={imageClassName}
                    />
                )}
            </button>

            {open &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setOpen(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Imagem ${alt}`}
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
                            src={src}
                            alt={alt}
                            className="max-h-full max-w-full rounded-lg object-contain"
                            onClick={(event) => event.stopPropagation()}
                        />
                    </div>,
                    document.body,
                )}
        </>
    );
}
