import { useEffect } from "react";

/**
 * Global scroll-reveal for public pages.
 * Observes every <section> and [data-reveal] inside <main> and adds
 * `.reveal-in` when it enters the viewport — CSS handles the cinematic
 * opacity / translateY / blur transition. Stagger is achieved through
 * nth-child transition delays on the revealed container's children.
 *
 * Re-runs on every route change (pathname) so newly rendered sections
 * are observed, plus a MutationObserver catches async-loaded content.
 * No-op when prefers-reduced-motion is set.
 */
export function useScrollReveal(pathname) {
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const main = document.querySelector("main");
        if (!main) return;

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("reveal-in");
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
        );

        const collect = () =>
            main.querySelectorAll("section, [data-reveal]");
        const observe = () => {
            collect().forEach((el) => {
                if (!el.classList.contains("reveal-in")) io.observe(el);
            });
        };
        observe();

        // Catch sections rendered after async data loads.
        let debounce;
        const mo = new MutationObserver(() => {
            clearTimeout(debounce);
            debounce = setTimeout(observe, 120);
        });
        mo.observe(main, { childList: true, subtree: true });

        return () => {
            io.disconnect();
            mo.disconnect();
            clearTimeout(debounce);
        };
    }, [pathname]);
}