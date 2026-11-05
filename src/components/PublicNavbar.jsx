import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogIn, UserPlus } from "lucide-react";
import { BRAND } from "@/lib/brand";

const NAV = [
    { label: "Home", path: "/" },
    { label: "Services", path: "/services" },
    { label: "Products", path: "/products" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Offers", path: "/offers" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
];

export default function PublicNavbar() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);
    const loc = useLocation();
    const isActive = (p) => (p === "/" ? loc.pathname === "/" : loc.pathname.startsWith(p));

    useEffect(() => {
        setOpen(false);
        const checkAuth = () => {
            try {
                if (typeof window === "undefined") return;
                const token = localStorage.getItem("token") || localStorage.getItem("rk_token");
                const stored = localStorage.getItem("rk_user");
                if (token && stored) {
                    setUser(JSON.parse(stored));
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            }
        };
        checkAuth();
        window.addEventListener("storage", checkAuth);
        return () => window.removeEventListener("storage", checkAuth);
    }, [loc.pathname]);

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
            <div className="cmyk-bar h-1 w-full" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-white font-heading font-extrabold text-sm">RK</span>
                        <span className="leading-none">
                            <span className="block font-heading font-extrabold tracking-tight text-[15px] text-ink">{BRAND.name}</span>
                            <span className="block text-[9px] font-semibold tracking-[0.25em] text-rk-red">{BRAND.tagline}</span>
                        </span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        {NAV.map((n) => (
                            <Link
                                key={n.path}
                                to={n.path}
                                className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${isActive(n.path) ? "text-rk-red" : "text-ink-soft hover:text-ink"}`}
                            >
                                {n.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden lg:flex items-center gap-2.5">
                        {user ? (
                            <Link
                                to="/portal"
                                className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                                title="Customer Portal"
                            >
                                <User className="h-4 w-4" />
                                <span className="max-w-[130px] truncate">{user.full_name || user.name || "My Portal"}</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-3.5 py-2 text-sm font-semibold text-ink hover:text-rk-red transition"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                                >
                                    <UserPlus className="h-4 w-4" /> Register
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex lg:hidden items-center">
                        <button className="grid h-10 w-10 place-items-center rounded-lg hover:bg-black/5" onClick={() => setOpen(!open)} aria-label="Menu">
                            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div className="lg:hidden border-t border-black/5 bg-white max-h-[80vh] overflow-y-auto">
                    <div className="px-4 py-3 space-y-1">
                        {NAV.map((n) => (
                            <Link key={n.path} to={n.path} onClick={() => setOpen(false)}
                                className={`block px-3 py-2.5 rounded-md text-sm font-medium ${isActive(n.path) ? "bg-rk-red/10 text-rk-red" : "text-ink"}`}>
                                {n.label}
                            </Link>
                        ))}

                        <div className="pt-3 border-t border-black/10 my-2">
                            {user ? (
                                <Link
                                    to="/portal"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white px-4 py-3 text-sm font-semibold hover:opacity-90 shadow-sm"
                                >
                                    <User className="h-4 w-4" />
                                    My Portal ({user.full_name || user.name || "Account"})
                                </Link>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Link
                                        to="/login"
                                        onClick={() => setOpen(false)}
                                        className="flex items-center justify-center gap-1.5 rounded-md border border-black/15 px-3 py-2.5 text-center text-sm font-semibold text-ink hover:bg-black/5"
                                    >
                                        <LogIn className="h-4 w-4" /> Log In
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setOpen(false)}
                                        className="flex items-center justify-center gap-1.5 rounded-md bg-rk-red text-white px-3 py-2.5 text-center text-sm font-semibold hover:opacity-90 shadow-sm"
                                    >
                                        <UserPlus className="h-4 w-4" /> Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
