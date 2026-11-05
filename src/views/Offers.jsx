import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/brand";
import { OFFERS } from "@/data/siteData";

export default function Offers(props) {
    const [items, setItems] = useState(props.initialOffers || OFFERS);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            try {
                const res = await api.entities.Offer.filter({ is_active: true }, "-created_date", 50);
                if (res?.length) setItems(res);
            } catch (e) { }
            setLoading(false);
        })();
    }, []);

    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">DEALS</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Special Offers</h1>
                    <p className="mt-4 text-white/60 max-w-2xl mx-auto">Limited-time deals on our most popular products.</p>
                </div>
            </section>
            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    {loading ? <p className="text-center text-ink-soft py-12">Loading...</p> :
                        items.length === 0 ? <p className="text-center text-ink-soft py-12">No active offers right now. Check back soon!</p> :
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {items.map((o) => (
                                    <div key={o.id} className="rounded-2xl border border-black/8 p-7 hover:shadow-lg transition">
                                        {o.discount && <span className="inline-block rounded-full bg-rk-red text-white px-3 py-1 text-xs font-bold">{o.discount}</span>}
                                        <h3 className="mt-3 font-heading font-bold text-xl text-ink">{o.title}</h3>
                                        <p className="mt-2 text-sm text-ink-soft">{o.description}</p>
                                        {o.starting_price ? <p className="mt-3 text-lg font-extrabold text-rk-red">From {formatINR(o.starting_price)}</p> : null}
                                        {o.valid_until && <p className="mt-2 text-xs text-ink-soft">Valid till {new Date(o.valid_until).toLocaleDateString("en-IN")}</p>}
                                        <Link to="/get-quote" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rk-red">{o.cta_text || "Get a Quote"} <ArrowRight className="h-3.5 w-3.5" /></Link>
                                    </div>
                                ))}
                            </div>}
                </div>
            </section>
        </div>
    );
}