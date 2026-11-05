import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Image as Img } from "@/components/ui/image";
import { PORTFOLIO_ITEMS } from "@/data/siteData";

const CATS = ["PRINTING", "BRANDING", "PACKAGING", "CORPORATE", "EVENTS", "PROMOTIONAL", "CAMPAIGN"];

export default function Portfolio(props) {
    const [items, setItems] = useState(props.initialItems || PORTFOLIO_ITEMS);
    const [cat, setCat] = useState("ALL");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.entities.PortfolioItem.list("-created_date", 100);
                if (res?.length) setItems(res);
            } catch (e) { }
            setLoading(false);
        })();
    }, []);

    const filtered = cat === "ALL" ? items : items.filter((p) => p.category === cat);

    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">OUR WORK</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Portfolio</h1>
                    <p className="mt-4 text-white/60 max-w-2xl mx-auto">A selection of recent printing, branding & packaging projects.</p>
                </div>
            </section>
            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="flex flex-wrap gap-2 mb-8 justify-center">
                        {[{ k: "ALL", l: "All" }, ...CATS.map(c => ({ k: c, l: c.charAt(0) + c.slice(1).toLowerCase() }))].map((c) => (
                            <button key={c.k} onClick={() => setCat(c.k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${cat === c.k ? "bg-rk-red text-white" : "bg-muted text-ink hover:bg-black/5"}`}>{c.l}</button>
                        ))}
                    </div>
                    {loading ? <p className="text-center text-ink-soft py-12">Loading...</p> :
                        filtered.length === 0 ? <p className="text-center text-ink-soft py-12">No projects yet.</p> :
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map((p) => (
                                    <div key={p.id} className="group relative rounded-2xl overflow-hidden aspect-[4/3]">
                                        <Img src={p.image_url} alt={p.title} className="w-full h-full" fittingType="fill" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-5">
                                            <div className="text-white"><span className="text-[10px] font-semibold tracking-wider text-rk-red">{p.category}</span><p className="font-heading font-bold">{p.title}</p>{p.client && <p className="text-xs text-white/70">{p.client}</p>}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>}
                </div>
            </section>
        </div>
    );
}