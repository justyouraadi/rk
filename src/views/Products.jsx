import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Search, ArrowRight, SlidersHorizontal, Star } from "lucide-react";
import { formatINR, SERVICE_CATEGORIES } from "@/lib/brand";
import { Image as Img } from "@/components/ui/image";
import ProductCard from "@/components/ProductCard";
import CustomRequestCTA from "@/components/CustomRequestCTA";
import { PRODUCTS, INDUSTRIES } from "@/data/siteData";

export default function Products(props) {
    const [params] = useSearchParams();
    const [items, setItems] = useState(props.initialProducts || PRODUCTS);
    const [industries, setIndustries] = useState(props.initialIndustries || INDUSTRIES);
    const [q, setQ] = useState("");
    const [cat, setCat] = useState(params?.get ? (params.get("cat") || "ALL") : "ALL");
    const [ind, setInd] = useState(params?.get ? (params.get("industry") || "ALL") : "ALL");
    const [sort, setSort] = useState("created");
    const [onlyFeatured, setOnlyFeatured] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [prods, inds] = await Promise.all([
                    api.entities.Product.list("-created_date", 2000),
                    api.entities.Industry.filter({ status: "ACTIVE" }, "sort_order", 500),
                ]);
                if (prods?.length) setItems(prods.filter((p) => p.status === "ACTIVE" || p.status === "COMING_SOON"));
                if (inds?.length) setIndustries(inds);
            } catch (e) { }
            setLoading(false);
        })();
    }, []);

    const filtered = items
        .filter((p) => (cat === "ALL" || p.category === cat))
        .filter((p) => (ind === "ALL" || (p.industries || []).includes(ind)))
        .filter((p) => (!q || (p.name + " " + (p.description || "")).toLowerCase().includes(q.toLowerCase())))
        .filter((p) => (!onlyFeatured || p.is_featured))
        .sort((a, b) => {
            if (sort === "price-low") return (a.starting_price || 0) - (b.starting_price || 0);
            if (sort === "price-high") return (b.starting_price || 0) - (a.starting_price || 0);
            if (sort === "name") return a.name.localeCompare(b.name);
            return new Date(b.created_date) - new Date(a.created_date);
        });

    return (
        <div>
            <section className="bg-ink text-white py-14 lg:py-18">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">CATALOGUE</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Product Catalogue</h1>
                    <p className="mt-4 text-white/60 max-w-2xl mx-auto">Search and browse our complete range of printed &amp; branded products. Filter by category or industry.</p>
                </div>
            </section>

            <section className="py-10 lg:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" />
                            <input className="rk-input pl-10" placeholder="Search products — e.g. Visiting Card, Banner, ID Card..." value={q} onChange={(e) => setQ(e.target.value)} />
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <select className="rk-input" value={cat} onChange={(e) => setCat(e.target.value)}>
                                <option value="ALL">All Categories</option>
                                {SERVICE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                            </select>
                            <select className="rk-input" value={ind} onChange={(e) => setInd(e.target.value)}>
                                <option value="ALL">All Industries</option>
                                {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                            <select className="rk-input" value={sort} onChange={(e) => setSort(e.target.value)}>
                                <option value="created">Newest</option>
                                <option value="name">Name A–Z</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-5">
                        <button onClick={() => setOnlyFeatured((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${onlyFeatured ? "border-rk-red bg-rk-red/5 text-rk-red" : "border-black/10 text-ink-soft"}`}>
                            <Star className="h-3.5 w-3.5" /> Featured only
                        </button>
                        <p className="text-sm text-ink-soft">{filtered.length} products</p>
                    </div>

                    {loading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />)}</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <SlidersHorizontal className="h-10 w-10 text-ink-soft/30 mx-auto mb-3" />
                            <p className="text-ink-soft">No products match your filters.</p>
                            <button onClick={() => { setQ(""); setCat("ALL"); setInd("ALL"); setOnlyFeatured(false); }} className="mt-3 text-sm font-semibold text-rk-red">Clear filters</button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {filtered.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <CustomRequestCTA />
        </div>
    );
}