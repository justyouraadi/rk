import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { easeCubic, usePrefersReducedMotion } from "@/lib/motion";
import { BRAND } from "@/lib/brand";

/**
 * Cinematic preloader — shows once per session.
 * RK logo centered, progress 0→100, then the logo "docks" toward the header
 * position (top-left) while the overlay fades/blurs away.
 */
export default function Preloader() {
    const reduced = usePrefersReducedMotion();
    const [show, setShow] = useState(true);
    const [progress, setProgress] = useState(0);
    const [docking, setDocking] = useState(false);
    const [dockTarget, setDockTarget] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (sessionStorage.getItem("rk_preloaded")) {
            setShow(false);
            return;
        }
        // Dock target: top-left where the navbar logo lives.
        setDockTarget({
            x: -(window.innerWidth / 2 - 40),
            y: -(window.innerHeight / 2 - 36),
        });

        if (reduced) {
            setProgress(100);
            const id = setTimeout(() => {
                sessionStorage.setItem("rk_preloaded", "1");
                setShow(false);
            }, 300);
            return () => clearTimeout(id);
        }

        let p = 0;
        let alive = true;
        const tick = () => {
            if (!alive) return;
            p += Math.random() * 14 + 7;
            if (p >= 100) {
                p = 100;
                setProgress(100);
                setTimeout(() => {
                    if (!alive) return;
                    setDocking(true);
                    sessionStorage.setItem("rk_preloaded", "1");
                    setTimeout(() => setShow(false), 820);
                }, 340);
                return;
            }
            setProgress(p);
            setTimeout(tick, Math.random() * 130 + 70);
        };
        const t = setTimeout(tick, 120);
        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [reduced]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-[100] grid place-items-center bg-ink"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: "blur(14px)" }}
                    transition={{ duration: 0.7, ease: easeCubic }}
                >
                    <div className="flex flex-col items-center gap-6">
                        <motion.div
                            className="flex items-center gap-3"
                            animate={
                                docking
                                    ? { x: dockTarget.x, y: dockTarget.y, scale: 0.34, opacity: 0 }
                                    : { x: 0, y: 0, scale: 1, opacity: 1 }
                            }
                            transition={{ duration: 0.8, ease: easeCubic }}
                        >
                            <span className="grid h-14 w-14 place-items-center rounded-xl bg-rk-red text-white font-heading font-extrabold text-xl">
                                RK
                            </span>
                            <span className="leading-none text-white">
                                <span className="block font-heading font-extrabold tracking-tight text-2xl">
                                    {BRAND.name}
                                </span>
                                <span className="block text-[10px] font-semibold tracking-[0.25em] text-rk-red">
                                    {BRAND.tagline}
                                </span>
                            </span>
                        </motion.div>

                        <motion.div
                            className="h-[2px] w-44 bg-white/15 overflow-hidden rounded-full"
                            animate={{ opacity: docking ? 0 : 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div
                                className="h-full bg-rk-red"
                                style={{ width: `${progress}%` }}
                            />
                        </motion.div>
                        <motion.span
                            className="text-white/50 text-xs tracking-[0.3em] font-semibold"
                            animate={{ opacity: docking ? 0 : 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {Math.round(progress)}%
                        </motion.span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}