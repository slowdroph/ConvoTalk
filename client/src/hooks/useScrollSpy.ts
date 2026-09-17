import { useEffect, useRef, useState } from "react";

const SECTIONS = [
    "recursos",
    "como-funciona",
    "seguranca",
    "arquitetura",
] as const;

export type SectionId = (typeof SECTIONS)[number];

function getActiveSection(): SectionId | "" {
    const offset = 120;
    let current: SectionId | "" = "";
    for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) {
            current = id;
        }
    }
    return current;
}

export function useScrollSpy() {
    const [activeSection, setActiveSection] = useState<SectionId | "">("");
    const [scrolled, setScrolled] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const scrollYRef = useRef(0);

    useEffect(() => {
        let ticking = false;

        const update = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const y = window.scrollY;
                scrollYRef.current = y;

                setActiveSection(getActiveSection());

                setScrolled((prev) => {
                    const next = y > 40;
                    return prev === next ? prev : next;
                });
                setShowBackToTop((prev) => {
                    const next = y > 400;
                    return prev === next ? prev : next;
                });

                ticking = false;
            });
        };

        update();
        window.addEventListener("scroll", update, { passive: true });

        return () => {
            window.removeEventListener("scroll", update);
        };
    }, []);

    return { activeSection, scrollYRef, scrolled, showBackToTop };
}
