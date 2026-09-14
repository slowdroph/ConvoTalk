import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR =
    'button, a, input, textarea, select, [role="button"], [tabindex="0"], [data-cursor="interactive"]';

const TEXT_INPUT_SELECTOR =
    'input, textarea, [contenteditable]:not([contenteditable="false"])';

const DOT_SIZE = 6;
const RING_SIZE = 32;
const LERP_FACTOR = 0.18;
const SCALE_LERP = 0.15;
const OPACITY_LERP = 0.2;

type CursorState = "default" | "hover" | "click" | "hidden";

function lerp(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
}

function isInteractiveElement(el: Element): boolean {
    return el.closest(INTERACTIVE_SELECTOR) !== null;
}

function isTextInputElement(el: Element): boolean {
    return el.closest(TEXT_INPUT_SELECTOR) !== null;
}

const SCALE_MAP: Record<CursorState, { dot: number; ring: number }> = {
    default: { dot: 1, ring: 1 },
    hover: { dot: 0.6, ring: 1.6 },
    click: { dot: 0.4, ring: 0.75 },
    hidden: { dot: 1, ring: 1 },
};

export default function CustomCursor() {
    const [enabled] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(pointer: fine)").matches;
    });

    const [visible, setVisible] = useState(false);

    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const targetPosRef = useRef({ x: 0, y: 0 });
    const ringPosRef = useRef({ x: 0, y: 0 });
    const rafIdRef = useRef(0);
    const stateRef = useRef<CursorState>("default");
    const visibleRef = useRef(false);
    const lastVisibleStateRef = useRef<"default" | "hover">("default");
    const firstMoveRef = useRef(true);
    const reducedMotionRef = useRef(false);
    const runningRef = useRef(false);
    const idleFramesRef = useRef(0);

    const dotScaleRef = useRef(1);
    const ringScaleRef = useRef(1);
    const dotScaleTargetRef = useRef(1);
    const ringScaleTargetRef = useRef(1);
    const dotOpacityRef = useRef(1);
    const ringOpacityRef = useRef(1);
    const dotOpacityTargetRef = useRef(1);
    const ringOpacityTargetRef = useRef(1);

    const clickAnimRef = useRef({ active: false, progress: 0 });

    useEffect(() => {
        if (!enabled) return;

        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedMotionRef.current = mq.matches;
        const handleMotionChange = (e: MediaQueryListEvent) => {
            reducedMotionRef.current = e.matches;
        };
        mq.addEventListener("change", handleMotionChange);

        const animate = () => {
            const dot = dotRef.current;
            const ring = ringRef.current;

            if (!dot || !ring) return;

            const { x, y } = targetPosRef.current;

            dot.style.transform = `translate3d(${x - DOT_SIZE / 2}px, ${y - DOT_SIZE / 2}px, 0)`;

            const factor = reducedMotionRef.current ? 1 : LERP_FACTOR;
            ringPosRef.current.x = lerp(ringPosRef.current.x, x, factor);
            ringPosRef.current.y = lerp(ringPosRef.current.y, y, factor);

            ring.style.transform = `translate3d(${ringPosRef.current.x - RING_SIZE / 2}px, ${ringPosRef.current.y - RING_SIZE / 2}px, 0)`;

            const scaleLerp = reducedMotionRef.current ? 1 : SCALE_LERP;
            const opacityLerp = reducedMotionRef.current ? 1 : OPACITY_LERP;

            let ringScaleTarget = ringScaleTargetRef.current;
            const dotScaleTarget = dotScaleTargetRef.current;

            if (clickAnimRef.current.active) {
                clickAnimRef.current.progress += 0.04;
                const p = clickAnimRef.current.progress;

                if (p < 0.4) {
                    const t = p / 0.4;
                    ringScaleTarget = lerp(ringScaleTargetRef.current, 0.65, t);
                } else if (p < 1) {
                    const t = (p - 0.4) / 0.6;
                    ringScaleTarget = lerp(0.65, ringScaleTargetRef.current, t);
                } else {
                    ringScaleTarget = ringScaleTargetRef.current;
                    clickAnimRef.current.active = false;
                }
            }

            ringScaleRef.current = lerp(ringScaleRef.current, ringScaleTarget, scaleLerp);
            dotScaleRef.current = lerp(dotScaleRef.current, dotScaleTarget, scaleLerp);

            dotOpacityRef.current = lerp(dotOpacityRef.current, dotOpacityTargetRef.current, opacityLerp);
            ringOpacityRef.current = lerp(ringOpacityRef.current, ringOpacityTargetRef.current, opacityLerp);

            const ds = dotScaleRef.current;
            const rs = ringScaleRef.current;
            const doo = dotOpacityRef.current;
            const roo = ringOpacityRef.current;

            dot.style.transform += ` scale(${ds})`;
            ring.style.transform += ` scale(${rs})`;

            dot.style.opacity = String(doo);
            ring.style.opacity = String(roo);

            const dx = ringPosRef.current.x - x;
            const dy = ringPosRef.current.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.5) {
                idleFramesRef.current++;
            } else {
                idleFramesRef.current = 0;
            }

            if (idleFramesRef.current >= 10) {
                stopLoop();
                return;
            }

            rafIdRef.current = requestAnimationFrame(animate);
        };

        const startLoop = () => {
            if (runningRef.current) return;
            runningRef.current = true;
            rafIdRef.current = requestAnimationFrame(animate);
        };

        const stopLoop = () => {
            runningRef.current = false;
            cancelAnimationFrame(rafIdRef.current);
        };

        const updateState = (next: CursorState) => {
            if (stateRef.current === next) return;
            stateRef.current = next;

            const scales = SCALE_MAP[next];
            dotScaleTargetRef.current = scales.dot;
            ringScaleTargetRef.current = scales.ring;

            if (next === "hidden") {
                dotOpacityTargetRef.current = 0;
                ringOpacityTargetRef.current = 0;
            } else {
                dotOpacityTargetRef.current = 1;
                ringOpacityTargetRef.current = 1;
            }

            if (next === "click") {
                clickAnimRef.current = { active: true, progress: 0 };
            }

            idleFramesRef.current = 0;
            if (next !== "hidden") {
                startLoop();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            targetPosRef.current.x = e.clientX;
            targetPosRef.current.y = e.clientY;
            idleFramesRef.current = 0;
            startLoop();

            if (!visibleRef.current) {
                visibleRef.current = true;
                setVisible(true);

                if (firstMoveRef.current) {
                    ringPosRef.current.x = e.clientX;
                    ringPosRef.current.y = e.clientY;
                    firstMoveRef.current = false;
                }
            }
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target;
            if (!(target instanceof Element)) return;

            if (isTextInputElement(target)) {
                updateState("hidden");
                return;
            }

            if (isInteractiveElement(target)) {
                lastVisibleStateRef.current = "hover";
                updateState("hover");
                return;
            }

            lastVisibleStateRef.current = "default";
            updateState("default");
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (stateRef.current === "hidden") return;

            const target = e.target;
            if (target instanceof Element && isTextInputElement(target)) {
                updateState("hidden");
                return;
            }

            updateState("click");
        };

        const handleMouseUp = () => {
            if (stateRef.current !== "click") return;
            updateState(lastVisibleStateRef.current);
        };

        const handleMouseLeave = () => {
            visibleRef.current = false;
            setVisible(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseover", handleMouseOver);
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mouseleave", handleMouseLeave);

        startLoop();

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mouseleave", handleMouseLeave);
            mq.removeEventListener("change", handleMotionChange);
            stopLoop();
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <div
            className={`custom-cursor ${visible ? "is-visible" : ""}`}
            aria-hidden="true"
        >
            <div ref={dotRef} className="custom-cursor__dot" />
            <div ref={ringRef} className="custom-cursor__ring" />
        </div>
    );
}
