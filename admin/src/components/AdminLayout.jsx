import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
    LayoutDashboard, Users, FileText, ClipboardList, Package, Boxes,
    Wallet, Image, Star, Tag, FileEdit, Settings, Bell, LogOut, Menu, X, Search,
    ShoppingCart, Truck, Palette, Factory, Layers, UploadCloud, History, Library, Loader2
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { BRAND } from "@/lib/brand";

const NAV = [
    { section: "Overview", items: [{ l: "Dashboard", p: "/admin", i: LayoutDashboard }] },
    {
        section: "Sales", items: [
            { l: "Leads", p: "/admin/leads", i: Users },
            { l: "Customers", p: "/admin/customers", i: FileText },
            { l: "Quotations", p: "/admin/quotations", i: ClipboardList },
            { l: "Orders", p: "/admin/orders", i: ShoppingCart },
        ]
    },
    {
        section: "Catalogue", items: [
            { l: "Catalogue Hub", p: "/admin/catalogue", i: Library },
            { l: "Industries", p: "/admin/industries", i: Factory },
            { l: "Categories", p: "/admin/categories", i: Layers },
            { l: "Products", p: "/admin/products", i: Package },
            { l: "Services", p: "/admin/services", i: Palette },
            { l: "Bulk Import", p: "/admin/bulk-import", i: UploadCloud },
            { l: "Bulk Images", p: "/admin/bulk-images", i: Image },
            { l: "Media Library", p: "/admin/media-library", i: Image },
            { l: "Import History", p: "/admin/import-history", i: History },
        ]
    },
    {
        section: "Operations", items: [
            { l: "Inventory", p: "/admin/inventory", i: Boxes },
            { l: "Payments", p: "/admin/payments", i: Wallet },
            { l: "Delivery", p: "/admin/delivery", i: Truck },
        ]
    },
    {
        section: "Content", items: [
            { l: "Portfolio", p: "/admin/portfolio", i: Image },
            { l: "Reviews", p: "/admin/reviews", i: Star },
            { l: "Offers", p: "/admin/offers", i: Tag },
            { l: "Blog / CMS", p: "/admin/blog", i: FileEdit },
        ]
    },
    { section: "System", items: [{ l: "Settings", p: "/admin/settings", i: Settings }] },
];

export default function AdminLayout() {
    const loc = useLocation();
    const nav = useNavigate();
    const [open, setOpen] = useState(false);
    const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();

    const isActive = (p) => (p === "/admin" ? loc.pathname === "/admin" : loc.pathname.startsWith(p));

    const handleLogout = async () => {
        logout(false);
        nav("/login", { replace: true });
    };

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen grid place-items-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-rk-red" />
                    <p className="text-xs font-medium text-ink-soft">Loading Admin Portal...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
    }

    return (
        <div className="min-h-screen bg-muted/30 flex">
            {/* Sidebar (Fixed on viewport) */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-white border-r border-black/8 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <div className="h-16 flex items-center gap-2.5 px-5 border-b border-black/8 shrink-0">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-rk-red text-white font-heading font-extrabold text-xs">RK</span>
                    <div><p className="font-heading font-extrabold text-sm leading-none">{BRAND.name}</p><p className="text-[9px] tracking-widest text-rk-red font-semibold mt-0.5">ADMIN PANEL</p></div>
                    <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
                </div>
                <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-5">
                    {NAV.map((g) => (
                        <div key={g.section}>
                            <p className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-ink-soft/60 uppercase">{g.section}</p>
                            <div className="space-y-0.5">
                                {g.items.map((it) => (
                                    <Link key={it.p} to={it.p} onClick={() => setOpen(false)} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive(it.p) ? "bg-rk-red text-white" : "text-ink-soft hover:bg-muted hover:text-ink"}`}>
                                        <it.i className="h-4 w-4" /> {it.l}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="p-3 border-t border-black/8 shrink-0">
                    <button onClick={handleLogout} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-muted w-full transition"><LogOut className="h-4 w-4" /> Logout</button>
                </div>
            </aside>

            {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)} />}

            {/* Main Content Area (Offset by sidebar width on desktop) */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                <header className="h-16 bg-white border-b border-black/8 flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-20">
                    <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
                    <div className="relative hidden sm:block max-w-xs flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" />
                        <input className="rk-input pl-10 py-2" placeholder="Search..." />
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-black/10 hover:bg-muted"><Bell className="h-4 w-4" /><span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rk-red" /></button>
                        <a href="http://localhost:4321" target="_blank" rel="noreferrer" className="text-sm font-semibold text-ink-soft hover:text-rk-red hidden sm:block">View Site</a>
                        <div className="flex items-center gap-2.5 pl-2 border-l border-black/10">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white text-sm font-bold uppercase">
                                {user?.name?.[0] || user?.email?.[0] || 'A'}
                            </span>
                            <div className="hidden md:block text-left leading-tight">
                                <p className="text-xs font-bold text-ink">{user?.name || user?.email?.split('@')[0] || 'Admin'}</p>
                                <p className="text-[10px] text-ink-soft font-semibold">{user?.role || 'SUPER_ADMIN'}</p>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
