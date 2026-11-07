import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { ArrowRight, Tag, Copy, Check, Calendar, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/brand";
import { OFFERS } from "@/data/siteData";

export default function Offers(props) {
    const [items, setItems] = useState(props.initialOffers || OFFERS);
    const [loading, setLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.entities.Offer.filter({ is_active: true }, "-created_date", 50);
                if (res?.length) setItems(res);
            } catch (e) { }
            setLoading(false);
        })();
    }, []);

    const copyCode = (code) => {
        if (!code) return;
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2500);
    };

    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red uppercase flex items-center justify-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> Exclusive Deals & Discounts
                    </span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Special Offers &amp; Packages</h1>
                    <p className="mt-4 text-white/60 max-w-2xl mx-auto">
                        Enjoy limited-time discounts, bulk print savings, and bundled offers on visiting cards, packaging, and business branding.
                    </p>
                </div>
            </section>

            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    {loading ? (
                        <p className="text-center text-ink-soft py-12">Loading offers...</p>
                    ) : items.length === 0 ? (
                        <p className="text-center text-ink-soft py-12">No active offers right now. Check back soon!</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((o) => {
                                const code = o.code || o.coupon_code || "";
                                let validText = o.validity || "Limited time offer";
                                if (o.valid_until) {
                                    const parsed = new Date(o.valid_until);
                                    if (!isNaN(parsed.getTime()) && !/^[a-zA-Z\s]+$/.test(o.valid_until)) {
                                        validText = `Valid till ${parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
                                    } else {
                                        validText = String(o.valid_until).startsWith("Valid") ? o.valid_until : `Valid: ${o.valid_until}`;
                                    }
                                }
                                const quoteUrl = `/get-quote?coupon=${encodeURIComponent(code)}&offer=${encodeURIComponent(o.title)}`;

                                return (
                                    <div
                                        key={o.id}
                                        className="relative rounded-2xl border border-black/8 bg-white p-7 shadow-sm hover:shadow-xl transition flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                {o.discount && (
                                                    <span className="inline-block rounded-full bg-rk-red text-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
                                                        {o.discount}
                                                    </span>
                                                )}
                                                {o.minOrder && (
                                                    <span className="text-xs font-semibold text-ink-soft bg-muted px-2.5 py-1 rounded-md">
                                                        Min: {o.minOrder}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="mt-4 font-heading font-bold text-xl text-ink leading-snug">
                                                {o.title}
                                            </h3>
                                            <p className="mt-2.5 text-sm text-ink-soft leading-relaxed">
                                                {o.description}
                                            </p>

                                            {o.starting_price ? (
                                                <p className="mt-4 text-lg font-extrabold text-rk-red">
                                                    From {formatINR(o.starting_price)}
                                                </p>
                                            ) : null}

                                            {/* Coupon Code Pill */}
                                            {code && (
                                                <div className="mt-5 flex items-center justify-between rounded-xl bg-muted/60 border border-dashed border-black/15 p-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-4 w-4 text-rk-red" />
                                                        <span className="font-mono font-bold text-sm text-ink tracking-wider">
                                                            {code}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyCode(code)}
                                                        className="inline-flex items-center gap-1 rounded-md bg-white border border-black/10 px-2 py-1 text-xs font-semibold text-ink-soft hover:text-ink transition"
                                                    >
                                                        {copiedCode === code ? (
                                                            <>
                                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                                <span className="text-emerald-600">Copied</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-3.5 w-3.5" />
                                                                <span>Copy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-black/6 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-ink-soft">
                                                <Calendar className="h-3.5 w-3.5 text-ink-soft/70" />
                                                <span>{validText}</span>
                                            </div>

                                            <a
                                                href={quoteUrl}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-rk-red hover:underline"
                                            >
                                                <span>Claim Offer</span>
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
