import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, UtensilsCrossed, GraduationCap, HeartPulse } from "lucide-react";

const BUNDLES = [
    {
        icon: Briefcase,
        title: "New Business Starter Kit",
        desc: "Visiting Cards, Letterheads, Envelopes, Bill Books, Shop Signage & Flyers.",
        cta: "/get-quote?bundle=New Business Starter Kit",
        tag: "FOR NEW BUSINESSES",
    },
    {
        icon: UtensilsCrossed,
        title: "Restaurant Branding Kit",
        desc: "Menu Cards, Table Tent Cards, Stickers, Packaging, Takeaway Bags & Flyers.",
        cta: "/get-quote?bundle=Restaurant Branding Kit",
        tag: "FOR RESTAURANTS",
    },
    {
        icon: GraduationCap,
        title: "Education Admission Kit",
        desc: "Admission Forms, Prospectus, Brochure, ID Cards, Posters, Banners & Standees.",
        cta: "/get-quote?bundle=Education Admission Kit",
        tag: "FOR SCHOOLS & COLLEGES",
    },
    {
        icon: HeartPulse,
        title: "Healthcare Branding Kit",
        desc: "Prescription Pads, Patient Files, Letterheads, Visiting Cards, Posters & Signage.",
        cta: "/get-quote?bundle=Healthcare Branding Kit",
        tag: "FOR CLINICS & HOSPITALS",
    },
];

export default function SolutionBundles() {
    return (
        <section className="py-16 lg:py-24 bg-muted/40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">SOLUTION BUNDLES</span>
                    <h2 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">Complete Kits for Your Business</h2>
                    <p className="mt-4 text-ink-soft">Pre-curated printing & branding bundles — everything you need to launch, in one quote.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {BUNDLES.map((b) => (
                        <Link key={b.title} to={b.cta} className="group rounded-2xl border border-black/8 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-white group-hover:bg-rk-red transition-colors"><b.icon className="h-6 w-6" /></div>
                                <span className="text-[9px] font-bold tracking-wider text-rk-red">{b.tag}</span>
                            </div>
                            <h3 className="mt-5 font-heading font-bold text-lg text-ink">{b.title}</h3>
                            <p className="mt-2 text-sm text-ink-soft leading-relaxed flex-1">{b.desc}</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rk-red">Get Bundle Quote <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" /></span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}