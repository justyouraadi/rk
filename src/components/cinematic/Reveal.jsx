import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { easeCubic, usePrefersReducedMotion } from "@/lib/motion";

/**
 * Manual scroll-reveal wrapper for finer-grained control on individual
 * elements (eyebrow → heading → description → CTA stagger).
 * Usage: <Reveal delay={0.1}>…</Reveal>
 */
export function Reveal({ children, delay = 0, y = 24, className = "", ...rest }) {
    const reduced = usePrefersReducedMotion();
    if (reduced) return <div className={className} {...rest}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.6, ease: easeCubic, delay }}
            {...rest}
        >
            {children}
        </motion.div>
    );
}

/**
 * Subtle scroll parallax — drifts children vertically counter to scroll.
 * Disabled on touch / reduced-motion.
 */
export function Parallax({ children, speed = 0.18, className = "" }) {
    const reduced = usePrefersReducedMotion();
    const ref = useRef(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        if (reduced) return;
        let raf = 0;
        const update = () => {
            const el = ref.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            const center = r.top + r.height / 2 - window.innerHeight / 2;
            setOffset(-center * speed);
        };
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [reduced, speed]);

    return (
        <div
            ref={ref}
            className={className}
            style={reduced ? undefined : { transform: `translateY(${offset}px)` }}
        >
            {children}
        </div>
    );
}