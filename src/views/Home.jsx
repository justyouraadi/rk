import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import {
    ArrowRight, MessageCircle, Printer, Palette, Package, Sparkles,
    Check, Star, MapPin, Phone, ShieldCheck, Clock, Users, Award, TrendingUp, Factory
} from "lucide-react";
import { BRAND, waLink, telLink, formatINR } from "@/lib/brand";
import { Image as Img } from "@/components/ui/image";
import SolutionBundles from "@/components/SolutionBundles";
import CustomRequestCTA from "@/components/CustomRequestCTA";
import ProductCard from "@/components/ProductCard";
import { SERVICES, PRODUCTS, REVIEWS, OFFERS, PORTFOLIO_ITEMS, INDUSTRIES } from "@/data/siteData";

const ICONS = { Printer, Palette, Package, Sparkles };

export default function Home(props) {
    const [services, setServices] = useState(props.initialServices || SERVICES);
    const [products, setProducts] = useState(props.initialProducts || PRODUCTS);
    const [reviews, setReviews] = useState(props.initialReviews || REVIEWS);
    const [offers, setOffers] = useState(props.initialOffers || OFFERS);
    const [portfolio, setPortfolio] = useState(props.initialPortfolio || PORTFOLIO_ITEMS);
    const [industries, setIndustries] = useState(props.initialIndustries || INDUSTRIES);

    useEffect(() => {
        (async () => {
            try {
                const [sv, pr, rv, of, po, ind] = await Promise.all([
                    api.entities.Service.list("-sort_order", 8).catch(() => []),
                    api.entities.Product.filter({ is_featured: true }, "-created_date", 8).catch(() => []),
                    api.entities.Review.filter({ is_approved: true }, "-created_date", 6).catch(() => []),
                    api.entities.Offer.filter({ is_active: true }, "-created_date", 3).catch(() => []),
                    api.entities.PortfolioItem.list("-created_date", 6).catch(() => []),
                    api.entities.Industry.filter({ status: "ACTIVE" }, "sort_order", 100).catch(() => []),
                ]);
                if (sv?.length) setServices(sv);
                if (pr?.length) setProducts(pr);
                if (rv?.length) setReviews(rv);
                if (of?.length) setOffers(of);
                if (po?.length) setPortfolio(po);
                if (ind?.length) setIndustries(ind);
            } catch (e) { /* ignore */ }
        })();
    }, []);

    const stats = [
        { icon: Award, value: "10+", label: "Years Experience" },
        { icon: Users, value: "12", label: "Industry Sectors" },
        { icon: Package, value: "4", label: "Core Categories" },
        { icon: Clock, value: "Fast", label: "Turnaround" },
    ];

    return (
        <div>
            {/* HERO */}
            <section className="relative overflow-hidden bg-white">
                <div className="absolute top-0 right-0 h-72 w-72 cmyk-dot rounded-full opacity-[0.06] blur-3xl" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-rk-red/10 px-3 py-1.5 text-xs font-semibold text-rk-red">
                                <span className="h-1.5 w-1.5 rounded-full bg-rk-red" /> {BRAND.category} · {BRAND.city}
                            </span>
                            <h1 className="mt-5 font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.05]">
                                Your Complete<br /><span className="text-rk-red">Printing & Branding</span> Partner
                            </h1>
                            <p className="mt-5 text-base sm:text-lg text-ink-soft max-w-xl leading-relaxed">
                                Business हो, School हो, Hospital हो, Shop हो या Event — आपकी Printing, Branding, Packaging और Offline Marketing की जरूरतों के लिए complete solutions.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to="/get-quote" className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rk-red/20 hover:opacity-90 transition">
                                    Get a Quote <ArrowRight className="h-4 w-4" />
                                </Link>
                                <a href={waLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-6 py-3.5 text-sm font-semibold text-ink hover:bg-black/5 transition">
                                    <MessageCircle className="h-4 w-4" /> WhatsApp Us
                                </a>
                            </div>
                            <div className="mt-8 flex items-center gap-6 text-xs text-ink-soft">
                                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-rk-red" /> Premium Quality</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-rk-red" /> Fast Turnaround</span>
                                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-rk-red" /> {BRAND.city}</span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/10 aspect-[4/3]">
                                <Img src={BRAND.heroImage} alt="RK Printers printing & branding composition" className="w-full h-full" fittingType="fill" />
                            </div>
                            <div className="absolute -bottom-5 -left-3 sm:-left-5 glass-card rounded-xl shadow-xl border border-black/5 p-4 flex items-center gap-3">
                                <div className="flex -space-x-1">
                                    <span className="h-7 w-7 rounded-full bg-rk-red border-2 border-white" />
                                    <span className="h-7 w-7 rounded-full bg-[hsl(187,100%,42%)] border-2 border-white" />
                                    <span className="h-7 w-7 rounded-full bg-[hsl(327,100%,47%)] border-2 border-white" />
                                    <span className="h-7 w-7 rounded-full bg-[hsl(48,100%,50%)] border-2 border-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-ink">CMYK Ready</p>
                                    <p className="text-[10px] text-ink-soft">Full colour printing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST STRIP */}
            <section className="bg-ink text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
                        {[{ l: "Printing", d: "Cards · Posters · Brochures" }, { l: "Branding", d: "Identity · Signage · Retail" }, { l: "Packaging", d: "Boxes · Labels · Bags" }, { l: "Promotional", d: "T-shirts · Caps · Gifts" }].map((s, i) => (
                            <div key={i} className="px-4 py-7 text-center lg:text-left">
                                <p className="font-heading font-bold text-base lg:text-lg">{s.l}</p>
                                <p className="text-xs text-white/50 mt-1">{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SERVICES */}
            <section className="py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">WHAT WE DO</span>
                        <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">Complete Solutions, One Roof</h2>
                        <p className="mt-4 text-ink-soft">From a single visiting card to a full branding campaign — we handle it all.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[{ k: "PRINTING", i: Printer, t: "Printing", d: "Visiting cards, posters, brochures, banners, flex, hoardings & stationery." },
                        { k: "BRANDING", i: Palette, t: "Branding", d: "Corporate identity, signage, retail & event branding solutions." },
                        { k: "PACKAGING", i: Package, t: "Packaging", d: "Product boxes, labels, stickers, shopping bags & thank-you cards." },
                        { k: "PROMOTIONAL", i: Sparkles, t: "Promotional", d: "Printed t-shirts, caps, flags, gifts & event materials." }].map((s) => (
                            <Link key={s.k} to={`/services?cat=${s.k}`} className="group rounded-2xl border border-black/8 bg-white p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-white group-hover:bg-rk-red transition-colors">
                                    <s.i className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 font-heading font-bold text-lg text-ink">{s.t}</h3>
                                <p className="mt-2 text-sm text-ink-soft leading-relaxed">{s.d}</p>
                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rk-red">Explore <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" /></span>
                            </Link>
                        ))}
                    </div>

                    {services.length > 0 && (
                        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {services.slice(0, 8).map((s) => (
                                <Link key={s.id} to={`/services/${s.slug || s.id}`} className="rounded-xl border border-black/8 p-5 hover:border-rk-red/40 hover:shadow-md transition">
                                    <span className="text-[10px] font-semibold tracking-wider text-rk-red">{s.category}</span>
                                    <p className="mt-1.5 font-heading font-bold text-ink">{s.title}</p>
                                    <p className="mt-1 text-xs text-ink-soft line-clamp-2">{s.short_description}</p>
                                    {s.starting_price ? <p className="mt-2 text-xs font-semibold text-ink">From {formatINR(s.starting_price)}</p> : null}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* WHAT ARE YOU LOOKING TO PRINT? */}
            {industries.length > 0 && (
                <section className="py-16 lg:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">INDUSTRY SOLUTIONS</span>
                            <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">What Are You Looking to Print?</h2>
                            <p className="mt-4 text-ink-soft">Choose your industry and discover printing, branding and promotional solutions designed for your business.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {industries.map((ind) => (
                                <Link key={ind.id} to={`/industries/${ind.slug || ind.id}`} className="group rounded-2xl border border-black/8 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white group-hover:bg-rk-red transition-colors">
                                        <Factory className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-4 font-heading font-bold text-sm text-ink leading-tight">{ind.name}</h3>
                                    {ind.short_description && <p className="mt-1 text-xs text-ink-soft line-clamp-2 flex-1">{ind.short_description}</p>}
                                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rk-red">Explore Solutions <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" /></span>
                                </Link>
                            ))}
                        </div>
                        <div className="text-center mt-8"><Link to="/industries" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rk-red">View All Industries <ArrowRight className="h-4 w-4" /></Link></div>
                    </div>
                </section>
            )}

            {/* SOLUTION BUNDLES */}
            <SolutionBundles />

            {/* STATS */}
            <section className="bg-ink text-white py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((s, i) => (
                        <div key={i} className="text-center">
                            <s.icon className="h-6 w-6 mx-auto text-rk-red" />
                            <p className="mt-3 font-heading font-extrabold text-3xl">{s.value}</p>
                            <p className="text-xs text-white/50 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURED PRODUCTS */}
            {products.length > 0 && (
                <section className="py-16 lg:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">POPULAR PRODUCTS</span>
                                <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">Popular Printing Products</h2>
                            </div>
                            <Link to="/products" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-rk-red">View all <ArrowRight className="h-4 w-4" /></Link>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {products.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* PORTFOLIO PREVIEW */}
            {portfolio.length > 0 && (
                <section className="py-16 lg:py-24 bg-muted/40">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">OUR WORK</span>
                            <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">Recent Projects</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {portfolio.map((p) => (
                                <div key={p.id} className="group relative rounded-2xl overflow-hidden aspect-[4/3]">
                                    <Img src={p.image_url} alt={p.title} className="w-full h-full" fittingType="fill" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-5">
                                        <div className="text-white">
                                            <span className="text-[10px] font-semibold tracking-wider text-rk-red">{p.category}</span>
                                            <p className="font-heading font-bold">{p.title}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* OFFERS */}
            {offers.length > 0 && (
                <section className="py-16 lg:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">LIMITED TIME</span>
                            <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">Special Offers</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-5">
                            {offers.map((o) => (
                                <div key={o.id} className="rounded-2xl border border-black/8 p-7 hover:shadow-lg transition">
                                    {o.discount && <span className="inline-block rounded-full bg-rk-red text-white px-3 py-1 text-xs font-bold">{o.discount}</span>}
                                    <h3 className="mt-3 font-heading font-bold text-xl text-ink">{o.title}</h3>
                                    <p className="mt-2 text-sm text-ink-soft">{o.description}</p>
                                    {o.starting_price ? <p className="mt-3 text-lg font-extrabold text-rk-red">From {formatINR(o.starting_price)}</p> : null}
                                    <Link to="/get-quote" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rk-red">{o.cta_text || "Get a Quote"} <ArrowRight className="h-3.5 w-3.5" /></Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* WHY CHOOSE US */}
            <section className="py-16 lg:py-24 bg-ink text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">WHY RK PRINTERS</span>
                        <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl">A Technology-Enabled Printing & Branding Company</h2>
                        <p className="mt-4 text-white/60 max-w-lg">We combine a large printing setup with a modern digital workflow — from enquiry to delivery, everything is tracked, transparent and fast.</p>
                        <div className="mt-8 grid sm:grid-cols-2 gap-4">
                            {[["Professional Quality", "Premium materials & colour-accurate CMYK printing."], ["Affordable Pricing", "Transparent quotes with no hidden charges."], ["Customized Solutions", "Tailored to your brand, size & quantity."], ["Fast Turnaround", "Express production & reliable delivery according to order specifications."]].map((f, i) => (
                                <div key={i} className="flex gap-3">
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rk-red"><Check className="h-3.5 w-3.5 text-white" /></span>
                                    <div><p className="font-semibold text-sm">{f[0]}</p><p className="text-xs text-white/50 mt-0.5">{f[1]}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-2xl aspect-video">
                        <Img src={BRAND.heroImage} alt="RK Printers" className="w-full h-full" fittingType="fill" />
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            {reviews.length > 0 && (
                <section className="py-16 lg:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">TESTIMONIALS</span>
                            <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">What Our Clients Say</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-5">
                            {reviews.map((r) => (
                                <div key={r.id} className="rounded-2xl border border-black/8 p-6">
                                    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < (r.rating || 5) ? "fill-rk-red text-rk-red" : "text-black/15"}`} />)}</div>
                                    <p className="mt-4 text-sm text-ink-soft leading-relaxed">"{r.comment || r.review}"</p>
                                    <div className="mt-5 flex items-center gap-3">
                                        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white font-bold text-sm">{r.name?.[0]}</span>
                                        <div><p className="font-semibold text-sm text-ink">{r.name}</p>{(r.company || r.business) && <p className="text-xs text-ink-soft">{r.company || r.business}</p>}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CUSTOM REQUEST */}
            <CustomRequestCTA />

            {/* CTA */}
            <section className="py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="rounded-3xl bg-rk-red text-white px-8 py-14 lg:px-16 lg:py-20 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-40 w-40 cmyk-dot rounded-full opacity-20 blur-2xl" />
                        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl relative">Ready to Print, Brand & Create?</h2>
                        <p className="mt-4 text-white/80 max-w-xl mx-auto relative">Get a custom quote in minutes. Our team will reach out on WhatsApp.</p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3 relative">
                            <Link to="/get-quote" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-rk-red hover:bg-white/90 transition">Get a Quote <ArrowRight className="h-4 w-4" /></Link>
                            <a href={waLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition"><MessageCircle className="h-4 w-4" /> WhatsApp Us</a>
                            <a href={telLink()} className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition"><Phone className="h-4 w-4" /> Call Now</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}