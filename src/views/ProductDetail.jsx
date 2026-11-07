import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { api } from "@/api/apiClient";
import { ArrowRight, MessageCircle, Check, Phone, Upload, ChevronRight } from "lucide-react";
import { BRAND, waLink, telLink, formatINR } from "@/lib/brand";
import { Image as Img } from "@/components/ui/image";
import ProductConfigurator from "@/components/ProductConfigurator";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS, INDUSTRIES } from "@/data/siteData";

export default function ProductDetail(props) {
    const routeParams = useParams();
    const slug = props.slug || routeParams?.slug;
    const [params] = useSearchParams();
    const ctxIndustry = params?.get ? params.get("industry") : null;
    const initialItem = props.product || PRODUCTS.find((p) => p.slug === slug || p.id === slug) || null;
    const [item, setItem] = useState(initialItem);
    const [industries, setIndustries] = useState(props.industries || INDUSTRIES);
    const [categories, setCategories] = useState([]);
    const [related, setRelated] = useState(
        initialItem ? PRODUCTS.filter((p) => p.category === initialItem.category && p.id !== initialItem.id).slice(0, 4) : []
    );
    const [loading, setLoading] = useState(false);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const [all, inds, cats] = await Promise.all([
                    api.entities.Product.list("-created_date", 2000),
                    api.entities.Industry.list("sort_order", 500),
                    api.entities.Category.list("sort_order", 500),
                ]);
                const found = all.find((p) => p.slug === slug || p.id === slug);
                if (found) {
                    setItem(found);
                    setRelated(all.filter((p) => p.category === found.category && p.id !== found.id && p.status === "ACTIVE").slice(0, 5));
                }
                if (inds?.length) setIndustries(inds);
                if (cats?.length) setCategories(cats.filter((c) => !c.industry_id));
            } catch (e) { }
            setLoading(false);
        })();
    }, [slug]);

    if (loading) return <div className="py-24 text-center text-ink-soft">Loading...</div>;
    if (!item) return <div className="py-24 text-center"><p className="text-ink-soft">Product not found.</p><Link to="/products" className="mt-4 inline-block text-rk-red font-semibold">← Back to products</Link></div>;

    const gallery = [item.image_url, ...(item.gallery || [])].filter(Boolean);
    const indNames = (item.industries || []).map((id) => industries.find((i) => i.id === id)?.name).filter(Boolean);
    const catNames = (item.category_ids || []).map((id) => categories.find((c) => c.id === id)?.name).filter(Boolean);

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:py-14">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-ink-soft mb-6 flex-wrap">
                <a href="/" className="hover:text-rk-red">Home</a><ChevronRight className="h-3 w-3" />
                <a href="/products" className="hover:text-rk-red">Products</a><ChevronRight className="h-3 w-3" />
                {ctxIndustry && (() => { const ind = industries.find((i) => i.id === ctxIndustry); return ind ? <><a href={`/industries/${ind.slug}`} className="hover:text-rk-red">{ind.name}</a><ChevronRight className="h-3 w-3" /></> : null; })()}
                <span className="text-ink font-medium">{item.name}</span>
            </nav>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Gallery */}
                <div>
                    <div className="rounded-2xl overflow-hidden aspect-square bg-muted border border-black/8">
                        {gallery[activeImg] ? <Img src={gallery[activeImg]} alt={item.name} className="w-full h-full" fittingType="fill" /> : <div className="w-full h-full grid place-items-center bg-gradient-to-br from-muted to-muted/50"><span className="text-ink-soft/30 text-sm">Product image coming soon</span></div>}
                    </div>
                    {gallery.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                            {gallery.map((g, i) => (
                                <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0 ${activeImg === i ? "border-rk-red" : "border-black/10"}`}>
                                    <Img src={g} alt={`${item.name} ${i + 1}`} className="w-full h-full" fittingType="fill" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info + Configurator */}
                <div>
                    {catNames.length > 0 && <span className="text-xs font-semibold tracking-wider text-rk-red">{catNames.join(" · ")}</span>}
                    <h1 className="mt-2 font-heading font-extrabold text-3xl text-ink">{item.name}</h1>
                    {item.short_description && <p className="mt-2 text-ink-soft">{item.short_description}</p>}
                    {item.description && <p className="mt-3 text-ink-soft leading-relaxed text-sm">{item.description}</p>}

                    {indNames.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {indNames.map((n) => <span key={n} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-ink-soft">{n}</span>)}
                        </div>
                    )}

                    {/* Key Benefits */}
                    {item.key_benefits?.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {item.key_benefits.map((b, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-sm text-ink-soft"><Check className="h-4 w-4 text-rk-red shrink-0" /> {b}</div>
                            ))}
                        </div>
                    )}

                    {/* Specs */}
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        {item.printing_type && <Spec k="Printing Type" v={item.printing_type} />}
                        {item.production_time && <Spec k="Production Time" v={item.production_time} />}
                        {item.moq ? <Spec k="MOQ" v={item.moq + " pcs"} /> : null}
                        <Spec k="Availability" v={(item.availability || "MADE_TO_ORDER").replace(/_/g, " ")} />
                    </div>

                    {/* Configurator */}
                    <ProductConfigurator product={item} industryId={ctxIndustry} />

                    {/* Secondary CTAs */}
                    <div className="mt-4 flex flex-wrap gap-3">
                        <a href={waLink(`Hello RK Printers,\nI am interested in:\nProduct: ${item.name}\nPlease share quotation.`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-muted"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                        <a href={telLink()} className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-muted"><Phone className="h-4 w-4" /> Call</a>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-ink-soft">
                        <a href={`/get-quote?product=${encodeURIComponent(item.name)}&product_id=${item.id}&step=2`} className="flex items-center gap-1.5 hover:text-rk-red font-semibold transition cursor-pointer"><Upload className="h-4 w-4 text-rk-red" /> Upload your design</a>
                        <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-rk-red" /> Custom design support</span>
                    </div>
                </div>
            </div>

            {/* Use Cases */}
            {item.use_cases?.length > 0 && (
                <section className="mt-12 pt-8 border-t border-black/8">
                    <h2 className="font-heading font-bold text-xl text-ink mb-4">Suitable For</h2>
                    <div className="flex flex-wrap gap-2">
                        {item.use_cases.map((u, i) => <span key={i} className="rounded-full bg-muted px-3 py-1.5 text-sm text-ink-soft">{u}</span>)}
                    </div>
                </section>
            )}

            {/* Related */}
            {related.length > 0 && (
                <section className="mt-12 pt-8 border-t border-black/8">
                    <h2 className="font-heading font-bold text-2xl text-ink mb-6">You May Also Need</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {related.map((r) => (
                            <ProductCard key={r.id} product={r} industryId={ctxIndustry} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function Spec({ k, v }) {
    return <div className="rounded-lg border border-black/8 px-3 py-2"><p className="text-[11px] text-ink-soft">{k}</p><p className="font-semibold text-ink text-sm">{v}</p></div>;
}