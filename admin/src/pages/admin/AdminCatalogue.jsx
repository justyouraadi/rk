import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import {
    Factory, Palette, Package, CheckCircle2, FileEdit, ImageOff, SearchX, Link2Off,
    Plus, UploadCloud, Image as ImageIcon, Download, ArrowRight,
} from "lucide-react";
import { checkCompleteness } from "@/lib/catalogue";

function StatCard({ icon: Icon, label, value, tone = "default", to }) {
    const tones = {
        default: "bg-white text-ink",
        red: "bg-rk-red text-white",
        amber: "bg-amber-50 text-amber-700 border border-amber-200",
        green: "bg-green-50 text-green-700 border border-green-200",
    };
    return (
        <Link to={to || "#"} className={`rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition ${tones[tone]}`}>
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone === "red" ? "bg-white/20" : "bg-muted/60"}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-heading font-extrabold leading-none">{value}</p>
                <p className={`text-xs font-medium mt-1 ${tone === "red" ? "text-white/80" : "text-ink-soft"}`}>{label}</p>
            </div>
        </Link>
    );
}

export default function AdminCatalogue() {
    const [data, setData] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [industries, services, products] = await Promise.all([
                    api.entities.Industry.list("-created_date", 500),
                    api.entities.Service.list("-created_date", 500),
                    api.entities.Product.list("-created_date", 500),
                ]);
                const active = products.filter((p) => p.status === "ACTIVE").length;
                const drafts = products.filter((p) => p.status === "DRAFT").length;
                const noImage = products.filter((p) => !p.image_url).length;
                const noSEO = products.filter((p) => !p.seo_title).length;
                const noIndustry = products.filter((p) => !p.industries || p.industries.length === 0).length;
                const incomplete = products.filter((p) => !checkCompleteness(p).complete).length;
                setData({ industries, services, products, active, drafts, noImage, noSEO, noIndustry, incomplete });
            } catch (e) {
                setData({ industries: [], services: [], products: [], active: 0, drafts: 0, noImage: 0, noSEO: 0, noIndustry: 0, incomplete: 0 });
            }
        })();
    }, []);

    if (!data) return <div className="p-8 text-center text-ink-soft">Loading catalogue…</div>;
    const { industries, services, products, active, drafts, noImage, noSEO, noIndustry, incomplete } = data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading font-extrabold text-2xl text-ink">Catalogue Management</h1>
                <p className="text-sm text-ink-soft">Data-driven control of every industry, service & product — no code edits needed.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Factory} label="Industries" value={industries.length} to="/admin/industries" />
                <StatCard icon={Palette} label="Services" value={services.length} to="/admin/services" />
                <StatCard icon={Package} label="Products" value={products.length} to="/admin/products" />
                <StatCard icon={CheckCircle2} label="Active Products" value={active} tone="green" to="/admin/products" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={FileEdit} label="Draft Products" value={drafts} tone="amber" to="/admin/products" />
                <StatCard icon={ImageOff} label="Without Images" value={noImage} tone="amber" to="/admin/products" />
                <StatCard icon={SearchX} label="Without SEO" value={noSEO} tone="amber" to="/admin/products" />
                <StatCard icon={Link2Off} label="Without Industry" value={noIndustry} tone="amber" to="/admin/products" />
            </div>

            <div className="rounded-2xl bg-white border border-black/8 p-5">
                <h2 className="font-heading font-bold text-lg mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Link to="/admin/industries" className="flex flex-col items-center gap-2 rounded-xl border border-black/8 p-4 hover:border-rk-red/40 hover:bg-muted/30 transition">
                        <Plus className="h-5 w-5 text-rk-red" /><span className="text-xs font-semibold text-center">Add Industry</span>
                    </Link>
                    <Link to="/admin/services" className="flex flex-col items-center gap-2 rounded-xl border border-black/8 p-4 hover:border-rk-red/40 hover:bg-muted/30 transition">
                        <Plus className="h-5 w-5 text-rk-red" /><span className="text-xs font-semibold text-center">Add Service</span>
                    </Link>
                    <Link to="/admin/products" className="flex flex-col items-center gap-2 rounded-xl border border-black/8 p-4 hover:border-rk-red/40 hover:bg-muted/30 transition">
                        <Plus className="h-5 w-5 text-rk-red" /><span className="text-xs font-semibold text-center">Add Product</span>
                    </Link>
                    <Link to="/admin/bulk-import" className="flex flex-col items-center gap-2 rounded-xl border border-black/8 p-4 hover:border-rk-red/40 hover:bg-muted/30 transition">
                        <UploadCloud className="h-5 w-5 text-rk-red" /><span className="text-xs font-semibold text-center">Bulk Import</span>
                    </Link>
                    <Link to="/admin/bulk-images" className="flex flex-col items-center gap-2 rounded-xl border border-black/8 p-4 hover:border-rk-red/40 hover:bg-muted/30 transition">
                        <ImageIcon className="h-5 w-5 text-rk-red" /><span className="text-xs font-semibold text-center">Upload Images</span>
                    </Link>
                    <Link to="/admin/media-library" className="flex flex-col items-center gap-2 rounded-xl border border-black/8 p-4 hover:border-rk-red/40 hover:bg-muted/30 transition">
                        <Download className="h-5 w-5 text-rk-red" /><span className="text-xs font-semibold text-center">Export / Media</span>
                    </Link>
                </div>
            </div>

            <div className="rounded-2xl bg-white border border-black/8 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-heading font-bold text-lg">Catalogue Completeness</h2>
                    <Link to="/admin/import-history" className="text-xs font-semibold text-rk-red hover:underline flex items-center gap-1">
                        Import History <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-green-500 transition-all" style={{ width: `${products.length ? Math.round(((products.length - incomplete) / products.length) * 100) : 0}%` }} />
                        </div>
                        <p className="text-xs text-ink-soft mt-1.5">
                            {products.length - incomplete} of {products.length} products fully complete
                            {incomplete > 0 && <span className="text-amber-600 font-semibold"> · {incomplete} need attention</span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}