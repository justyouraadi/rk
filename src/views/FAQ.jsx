import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";

export default function FAQ() {
    const [faqs, setFaqs] = useState([]);
    const [open, setOpen] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const sv = await api.entities.Service.list("-sort_order", 100);
                const all = sv.flatMap((s) => s.faqs || []);
                if (all.length) setFaqs(all);
                else setFaqs(DEFAULTS);
            } catch (e) { setFaqs(DEFAULTS); }
        })();
    }, []);

    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">HELP</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Frequently Asked Questions</h1>
                </div>
            </section>
            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-3">
                    {faqs.map((f, i) => (
                        <div key={i} className="rounded-xl border border-black/8 overflow-hidden">
                            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                                <span className="font-semibold text-ink">{f.q}</span>
                                <span className={`text-rk-red text-xl transition ${open === i ? "rotate-45" : ""}`}>+</span>
                            </button>
                            {open === i && <p className="px-5 pb-5 text-sm text-ink-soft">{f.a}</p>}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

const DEFAULTS = [
    { q: "What is the minimum order quantity?", a: "It depends on the product. Visiting cards start from 100, while banners and flex can be ordered as single pieces. Contact us for specifics." },
    { q: "How long does delivery take?", a: "Most standard orders are ready within 48 hours. Bulk and custom jobs may take longer — we'll confirm timelines in your quote." },
    { q: "Do you provide design services?", a: "Yes. Our design team can create your artwork, and you'll approve it before printing through our design approval workflow." },
    { q: "What file formats do you accept?", a: "PDF, JPG, PNG, AI, CDR, PSD and ZIP. You can upload files directly in the quote form or share them on WhatsApp." },
    { q: "Do you offer bulk discounts?", a: "Yes — pricing is quantity-based and your custom quote will reflect any applicable discounts." },
];