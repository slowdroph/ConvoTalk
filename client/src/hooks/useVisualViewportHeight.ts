import { useEffect, useState } from "react";

export function useVisualViewportHeight(): number {
    const [height, setHeight] = useState<number>(() =>
        typeof window !== "undefined"
            ? window.visualViewport?.height ?? window.innerHeight
            : 0,
    );

    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const handleResize = () => setHeight(vv.height);

        vv.addEventListener("resize", handleResize);
        vv.addEventListener("scroll", handleResize);
        return () => {
            vv.removeEventListener("resize", handleResize);
            vv.removeEventListener("scroll", handleResize);
        };
    }, []);

    return height;
}