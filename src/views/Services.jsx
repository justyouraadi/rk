import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { ArrowRight, Search, Printer, Palette, Package, Sparkles, Factory } from "lucide-react";
import { Image as Img } from "@/components/ui/image";
import { INDUSTRIES } from "@/data/siteData";

const SERVICE_CATS = [
    { k: "PRINTING", i: Printer, t: "Commercial Printing", d: "Visiting cards, brochures, banners, stationery & more." },
    { k: "BRANDING", i: Palette, t: "Branding & Design", d: "Corporate identity, signage, retail & event branding." },
    { k: "PACKAGING", i: Package, t: "Packaging & Labels", d: "Boxes, bags, product labels & custom packaging." },
    { k: "PROMOTIONAL", i: Sparkles, t: "Promotional & Apparel", d: "T-shirts, caps, flags, gifts & event materials." },
];

export default function Services(props) {
    const [industries, setIndustries] = useState(props.initialIndustries || INDUSTRIES);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.entities.Industry.filter({ status: "ACTIVE" }, "sort_order", 500)
            .then(res => { if (res?.length) setIndustries(res); }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const filtered = industries.filter((ind) => !q || (ind.name + " " + (ind.short_description || "")).toLowerCase().includes(q.toLowerCase()));

    return (
        <div>
            {/* HERO — Industry First */}
            <section className="relative bg-ink text-white py-16 lg:py-24 overflow-hidden">
                <div className="absolute top-0 right-0 h-80 w-80 cmyk-dot rounded-full opacity-[0.05] blur-3xl" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center relative">
                    <span className="inline-flex items-center gap-2 rounded-full bg-rk-red/20 px-3 py-1.5 text-xs font-semibold text-rk-red">
                        <Factory className="h-3.5 w-3.5" /> INDUSTRY-FIRST DISCOVERY
                    </span>
                    <h1 className="mt-5 font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">Printing Solutions for<br /><span className="text-rk-red">Every Industry</span></h1>
                    <p className="mt-5 text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
                        From everyday business stationery to complete branding and packaging requirements, discover solutions tailored to your industry.
                    </p>
                    <p className="mt-2 text-sm text-white/40 max-w-xl mx-auto">Tell us your industry — we'll show you everything RK Printers can print, brand, package &amp; promote for you.</p>
                    <div className="mt-8 relative max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <input className="w-full rounded-lg bg-white/10 border border-white/15 pl-9 pr-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-rk-red" placeholder="Search your industry..." value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                </div>
            </section>

            {/* INDUSTRY CARDS */}
            <section className="py-14 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    {loading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}</div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-ink-soft py-12">No industries found. <Link to="/get-quote" className="text-rk-red font-semibold">Request a custom quote</Link>.</p>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map((ind) => (
                                <Link key={ind.id} to={`/industries/${ind.slug || ind.id}`} className="group rounded-2xl overflow-hidden border border-black/8 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                                        {ind.image_url ? <Img src={ind.image_url} alt={ind.name} className="w-full h-full" fittingType="fill" /> : (
                                            <div className="w-full h-full grid place-items-center bg-gradient-to-br from-muted to-muted/50">
                                                <Factory className="h-10 w-10 text-ink-soft/30" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <h3 className="font-heading font-bold text-lg text-white drop-shadow">{ind.name}</h3>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-sm text-ink-soft line-clamp-2">{ind.short_description || ind.description}</p>
                                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rk-red">Explore Solutions <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" /></span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* SERVICE CATEGORIES */}
            <section className="py-14 lg:py-20 bg-muted/40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">OR BROWSE BY</span>
                        <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">Printing Service Categories</h2>
                        <p className="mt-4 text-ink-soft">Prefer to browse by service type? Explore our four core printing &amp; branding categories.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {SERVICE_CATS.map((s) => (
                            <Link key={s.k} to={`/products?cat=${s.k}`} className="group rounded-2xl border border-black/8 bg-white p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-white group-hover:bg-rk-red transition-colors"><s.i className="h-6 w-6" /></div>
                                <h3 className="mt-5 font-heading font-bold text-lg text-ink">{s.t}</h3>
                                <p className="mt-2 text-sm text-ink-soft leading-relaxed">{s.d}</p>
                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rk-red">Browse <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" /></span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}