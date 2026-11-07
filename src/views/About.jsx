import React from "react";
import { Link } from "react-router-dom";
import { Award, Users, Package, Clock, MapPin, Phone, ArrowRight } from "lucide-react";
import { BRAND, telLink } from "@/lib/brand";

export default function About() {
    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">ABOUT US</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">RK Printers</h1>
                    <p className="mt-4 text-white/60 max-w-2xl mx-auto">{BRAND.positioning}. {BRAND.tagline}</p>
                </div>
            </section>

            <section className="py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">OUR STORY</span>
                        <h2 className="mt-3 font-heading font-extrabold text-3xl">A Modern Printing & Branding Company</h2>
                        <p className="mt-5 text-ink-soft leading-relaxed">Based in {BRAND.city}, {BRAND.state}, RK Printers has grown from a local print shop into a complete printing & branding solutions provider. We serve businesses across the region with printing, branding, packaging and promotional products — all under one roof.</p>
                        <p className="mt-4 text-ink-soft leading-relaxed">Our approach combines a large printing setup with a modern digital workflow. From the first enquiry to final delivery, every order is tracked, transparent and delivered with professional quality.</p>
                        <div className="mt-7 flex gap-3">
                            <Link to="/get-quote" className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-5 py-3 text-sm font-semibold text-white">Get a Quote <ArrowRight className="h-4 w-4" /></Link>
                            <a href={telLink()} className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-5 py-3 text-sm font-semibold text-ink"><Phone className="h-4 w-4" /> Call</a>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[{ i: Award, v: "10+", l: "Years" }, { i: Users, v: "12", l: "Industries" }, { i: Package, v: "4", l: "Core Categories" }, { i: Clock, v: "Express", l: "Turnaround" }].map((s, i) => (
                            <div key={i} className="rounded-2xl border border-black/8 p-6 text-center"><s.i className="h-7 w-7 mx-auto text-rk-red" /><p className="mt-3 font-heading font-extrabold text-2xl">{s.v}</p><p className="text-xs text-ink-soft">{s.l}</p></div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-14 bg-muted/40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <h2 className="font-heading font-extrabold text-2xl text-center mb-8">Visit Us</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="rounded-2xl bg-white border border-black/8 p-8">
                            <MapPin className="h-6 w-6 text-rk-red" />
                            <h3 className="mt-3 font-heading font-bold text-lg">Our Address</h3>
                            <p className="mt-2 text-ink-soft text-sm">{BRAND.address}</p>
                            <p className="mt-4 font-semibold text-ink">{BRAND.phone1}</p>
                            <p className="text-ink">{BRAND.phone2}</p>
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-black/8 min-h-[280px]">
                            <iframe title="RK Printers Location" className="w-full h-full min-h-[280px]" loading="lazy"
                                src="https://www.google.com/maps?q=Kotputli,Rajasthan,303108&output=embed" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}