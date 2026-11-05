import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { ArrowRight, MessageCircle, Factory, ArrowLeft, Search, Phone, HelpCircle } from "lucide-react";
import { waLink, formatINR, telLink } from "@/lib/brand";
import { Image as Img } from "@/components/ui/image";
import ProductCard from "@/components/ProductCard";
import { INDUSTRIES, PRODUCTS } from "@/data/siteData";

export default function IndustryDetail(props) {
    const routeParams = useParams();
    const slug = props.slug || routeParams?.slug;
    const initialInd = props.industry || INDUSTRIES.find((i) => i.slug === slug || i.id === slug) || null;
    const initialProducts = initialInd
        ? PRODUCTS.filter((p) => (p.industries || []).includes(initialInd.slug) || (p.industries || []).includes(initialInd.id))
        : [];
    const [industry, setIndustry] = useState(initialInd);
    const [products, setProducts] = useState(initialProducts);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [activeCat, setActiveCat] = useState("ALL");

    useEffect(() => {
        (async () => {
            try {
                const [inds, prods, cats] = await Promise.all([
                    api.entities.Industry.list("sort_order", 500),
                    api.entities.Product.list("-created_date", 2000),
                    api.entities.Category.list("sort_order", 500),
                ]);
                const found = inds.find((i) => i.slug === slug || i.id === slug);
                if (found) {
                    setIndustry(found);
                    const industryProducts = prods.filter((p) => ((p.industries || []).includes(found.id) || (p.industries || []).includes(found.slug)) && p.status === "ACTIVE");
                    if (industryProducts.length) setProducts(industryProducts);
                    const masterCats = cats.filter((c) => !c.industry_id && c.status === "ACTIVE");
                    setCategories(masterCats.filter((mc) => industryProducts.some((p) => (p.category_ids || []).includes(mc.id))));
                }
            } catch (e) { }
            setLoading(false);
        })();
    }, [slug]);

    const filtered = products.filter((p) =>
        (activeCat === "ALL" || (p.category_ids || []).includes(activeCat)) &&
        (!q || (p.name + " " + (p.description || "")).toLowerCase().includes(q.toLowerCase()))
    );

    if (loading) return <div className="py-24 text-center text-ink-soft">Loading...</div>;
    if (!industry) return <div className="py-24 text-center"><p className="text-ink-soft">Industry not found.</p><Link to="/services" className="mt-4 inline-block text-rk-red font-semibold">← Back to services</Link></div>;

    return (
        <div>
            {/* HERO */}
            <section className="relative bg-ink text-white py-14 lg:py-20 overflow-hidden">
                {industry.image_url && <div className="absolute inset-0 opacity-20"><Img src={industry.image_url} alt={industry.name} className="w-full h-full" fittingType="fill" /></div>}
                <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/60" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
                    <Link to="/services" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> All Industries</Link>
                    <div className="mt-5 flex items-center gap-2"><Factory className="h-5 w-5 text-rk-red" /><span className="text-xs font-semibold tracking-[0.2em] text-rk-red">{industry.name.toUpperCase()}</span></div>
                    <h1 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight max-w-3xl">Everything Your {industry.name} Business Needs to Print &amp; Brand</h1>
                    <p className="mt-4 text-white/60 max-w-2xl leading-relaxed">{industry.description || industry.short_description}</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link to={`/get-quote?industry=${industry.id}`} className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-5 py-3 text-sm font-semibold text-white">Get a Quote <ArrowRight className="h-4 w-4" /></Link>
                        <a href={waLink(`Hello, I'm from the ${industry.name} industry and need printing solutions.`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><MessageCircle className="h-4 w-4" /> WhatsApp Us</a>
                    </div>
                    <p className="mt-5 text-sm text-white/40">{products.length} products available for {industry.name}</p>
                </div>
            </section>

            {/* SUB-CATEGORY FILTER CHIPS */}
            {categories.length > 0 && (
                <section className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-black/8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setActiveCat("ALL")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCat === "ALL" ? "bg-rk-red text-white" : "border border-black/10 text-ink hover:border-rk-red hover:text-rk-red"}`}>All</button>
                            {categories.map((c) => (
                                <button key={c.id} onClick={() => setActiveCat(c.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCat === c.id ? "bg-rk-red text-white" : "border border-black/10 text-ink hover:border-rk-red hover:text-rk-red"}`}>{c.name}</button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* PRODUCTS */}
            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                        <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10" placeholder={`Search ${industry.name} products...`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
                        <div className="text-sm text-ink-soft sm:py-2.5 sm:px-2">{filtered.length} of {products.length} products</div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-ink-soft">No products listed for {industry.name} yet.</p>
                            <Link to={`/get-quote?industry=${industry.id}`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rk-red text-white px-5 py-3 text-sm font-semibold">Request a Custom Quote <ArrowRight className="h-4 w-4" /></Link>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {filtered.map((p) => (
                                <ProductCard key={p.id} product={p} industryId={industry.id} categoryName={categories.find((c) => (p.category_ids || []).includes(c.id))?.name} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* COMPLETE SOLUTIONS CROSS-SELL */}
            {products.length > 0 && (
                <section className="py-12 bg-muted/40">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                        <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">COMPLETE SOLUTIONS</span>
                        <h2 className="mt-3 font-heading font-extrabold text-2xl sm:text-3xl text-ink">Complete Printing Solutions for Your Business</h2>
                        <p className="mt-3 text-ink-soft max-w-xl mx-auto">Everything {industry.name} needs — from stationery to signage, all in one place.</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link to={`/get-quote?industry=${industry.id}`} className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-3 text-sm font-semibold text-white">Get a Quote <ArrowRight className="h-4 w-4" /></Link>
                            <a href={waLink(`Hello, I'm from the ${industry.name} industry and need printing solutions.`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold text-ink hover:bg-white"><MessageCircle className="h-4 w-4" /> WhatsApp Us</a>
                            <a href={telLink()} className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold text-ink hover:bg-white"><Phone className="h-4 w-4" /> Call Now</a>
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ */}
            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 text-rk-red"><HelpCircle className="h-5 w-5" /><span className="text-xs font-semibold tracking-[0.2em]">FAQ</span></div>
                        <h2 className="mt-3 font-heading font-extrabold text-2xl sm:text-3xl text-ink">{industry.name} Printing — Frequently Asked</h2>
                    </div>
                    <div className="space-y-3">
                        {[
                            { q: `What types of printing do you offer for ${industry.name}?`, a: `We offer complete printing, branding, packaging and promotional solutions for ${industry.name} — including stationery, signage, labels, ID cards, marketing material and more.` },
                            { q: "What is the minimum order quantity?", a: "MOQ varies by product. Most products start from 100 pieces. Custom quantities are available — request a quote for details." },
                            { q: "How long does production take?", a: "Most orders are completed within 24–48 hours. Larger or custom orders may take 3–5 days. Rush orders are available on request." },
                            { q: "Can I get a custom design?", a: "Yes. Our design team can help create custom designs for your brand. Upload your artwork or describe what you need in the quote form." },
                            { q: "Do you offer bulk pricing?", a: "Yes. Quantity-based pricing tiers are available. The more you order, the better the per-unit price." },
                        ].map((f, i) => (
                            <details key={i} className="group rounded-xl border border-black/8 bg-white p-4">
                                <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-ink list-none">
                                    {f.q}
                                    <span className="ml-3 text-rk-red text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                                </summary>
                                <p className="mt-3 text-sm text-ink-soft leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}