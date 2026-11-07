import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { BRAND, waLink, telLink } from "@/lib/brand";

export default function PublicFooter() {
    return (
        <footer className="bg-ink text-white">
            <div className="cmyk-bar h-1 w-full" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-rk-red text-white font-heading font-extrabold text-sm">RK</span>
                            <span>
                                <span className="block font-heading font-extrabold tracking-tight">{BRAND.name}</span>
                                <span className="block text-[9px] font-semibold tracking-[0.25em] text-white/60">{BRAND.tagline}</span>
                            </span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">{BRAND.positioning}. Complete printing, branding, packaging & promotional solutions under one roof.</p>
                        <div className="flex gap-2 mt-4">
                            <a href={BRAND.instagram || "https://instagram.com"} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-md bg-white/10 hover:bg-rk-red transition" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
                            <a href={BRAND.facebook || "https://facebook.com"} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-md bg-white/10 hover:bg-rk-red transition" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold text-sm mb-4">Explore</h4>
                        <ul className="space-y-2.5 text-sm text-white/60">
                            <li><Link to="/services" className="hover:text-white">Services</Link></li>
                            <li><Link to="/industries" className="hover:text-white">Industries</Link></li>
                            <li><Link to="/products" className="hover:text-white">Products</Link></li>
                            <li><Link to="/portfolio" className="hover:text-white">Portfolio</Link></li>
                            <li><Link to="/offers" className="hover:text-white">Offers</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold text-sm mb-4">Popular Industries</h4>
                        <ul className="space-y-2.5 text-sm text-white/60">
                            <li><Link to="/industries/healthcare" className="hover:text-white">Healthcare</Link></li>
                            <li><Link to="/industries/education" className="hover:text-white">Education</Link></li>
                            <li><Link to="/industries/corporate" className="hover:text-white">Corporate</Link></li>
                            <li><Link to="/industries/retail" className="hover:text-white">Retail</Link></li>
                            <li><Link to="/industries/real-estate" className="hover:text-white">Real Estate</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold text-sm mb-4">Company</h4>
                        <ul className="space-y-2.5 text-sm text-white/60">
                            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                            <li><Link to="/portfolio" className="hover:text-white">Portfolio</Link></li>
                            <li><Link to="/offers" className="hover:text-white">Offers</Link></li>
                            <li><Link to="/get-quote" className="hover:text-white">Get a Quote</Link></li>
                            <li><Link to="/track-order" className="hover:text-white">Track Order</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-bold text-sm mb-4">Contact</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li className="flex gap-2.5"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-rk-red" /><span>{BRAND.address}</span></li>
                            <li className="flex gap-2.5"><Phone className="h-4 w-4 mt-0.5 shrink-0 text-rk-red" /><span><a href={telLink()} className="hover:text-white transition">{BRAND.phone1}</a><br /><a href={`tel:+91${BRAND.phone2}`} className="hover:text-white transition">{BRAND.phone2}</a></span></li>
                            <li className="flex gap-2.5"><Mail className="h-4 w-4 mt-0.5 shrink-0 text-rk-red" /><span>{BRAND.email}</span></li>
                        </ul>
                        <a href={waLink()} target="_blank" rel="noreferrer" className="inline-flex mt-4 rounded-md bg-white/10 hover:bg-rk-red px-4 py-2 text-sm font-semibold transition">WhatsApp Us</a>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/50">
                    <p>&copy; {new Date().getFullYear()}&nbsp;{BRAND.name}. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white">Terms & Conditions</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}