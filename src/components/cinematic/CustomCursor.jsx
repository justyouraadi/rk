import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion, useIsTouch } from "@/lib/motion";

/**
 * Custom cinematic cursor for desktop only.
 * - 12px central dot that tracks the pointer instantly
 * - 36px outer ring that eases toward the pointer via rAF
 * - Expands slightly over interactive elements
 * - Hidden on touch devices and when prefers-reduced-motion is set
 */
export default function CustomCursor() {
    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const reduced = usePrefersReducedMotion();
    const touch = useIsTouch();
    const [visible, setVisible] = useState(false);
    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        if (reduced || touch) return;
        document.documentElement.classList.add("cursor-cinematic");

        let tx = 0,
            ty = 0,
            rx = 0,
            ry = 0;
        let raf = 0;
        let firstMove = false;

        const onMove = (e) => {
            tx = e.clientX;
            ty = e.clientY;
            if (!firstMove) {
                firstMove = true;
                rx = tx;
                ry = ty;
                setVisible(true);
            }
            if (dotRef.current) {
                dotRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
            }
            const t = e.target;
            const interactive = !!t?.closest?.(
                "a,button,[role=button],input,select,textarea,label,[data-cursor]"
            );
            setHovering(interactive);
        };

        const onLeave = () => setVisible(false);
        const onEnter = () => setVisible(true);

        const loop = () => {
            rx += (tx - rx) * 0.18;
            ry += (ty - ry) * 0.18;
            if (ringRef.current) {
                ringRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        window.addEventListener("mousemove", onMove, { passive: true });
        document.addEventListener("mouseleave", onLeave);
        document.addEventListener("mouseenter", onEnter);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseleave", onLeave);
            document.removeEventListener("mouseenter", onEnter);
            document.documentElement.classList.remove("cursor-cinematic");
        };
    }, [reduced, touch]);

    if (reduced || touch) return null;

    return (
        <div
            className="cinematic-cursor"
            aria-hidden
            style={{ opacity: visible ? 1 : 0 }}
        >
            <div ref={dotRef} className="cc-dot" />
            <div ref={ringRef} className={`cc-ring${hovering ? " cc-ring-hover" : ""}`} />
        </div>
    );
}