import { useEffect, useState } from "react";

// Cinematic easing — easeInOutCubic as a cubic-bezier array for framer-motion
export const easeCubic = [0.65, 0, 0.35, 1];
export const easeOutCubic = [0.33, 1, 0.68, 1];

// Page-level entrance: opacity + vertical reveal + subtle scale (no filter on
// the container, so position:sticky inside pages keeps working).
export const pageEnter = {
    initial: { opacity: 0, y: 16, scale: 0.992 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: easeCubic },
    },
};

// Veil that blurs the incoming page then clears (backdrop-filter, fading opacity)
export const veilEnter = {
    initial: { opacity: 1 },
    animate: {
        opacity: 0,
        transition: { duration: 0.45, ease: easeCubic },
    },
};

// Manual reveal variant (for Reveal component)
export const fadeUp = {
    hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: easeCubic },
    },
};

export function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => setReduced(mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);
    return reduced;
}

export function useIsTouch() {
    const [touch, setTouch] = useState(false);
    useEffect(() => {
        setTouch(window.matchMedia("(pointer: coarse)").matches);
    }, []);
    return touch;
}