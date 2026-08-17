import { useEffect, useState } from "react";

const SECTIONS = ["recursos", "como-funciona", "seguranca"] as const;

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
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        let ticking = false;

        const update = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                setActiveSection(getActiveSection());
                setScrollY(window.scrollY);
                ticking = false;
            });
        };

        update();
        window.addEventListener("scroll", update, { passive: true });

        return () => {
            window.removeEventListener("scroll", update);
        };
    }, []);

    return { activeSection, scrollY };
}
