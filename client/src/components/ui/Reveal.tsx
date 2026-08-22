import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface RevealProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export default function Reveal({
    children,
    delay = 0,
    className = "",
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out ${
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
            } ${className}`}
        >
            {children}
        </div>
    );
}
