import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { ArrowRight, MessageCircle, Check, Phone } from "lucide-react";
import { BRAND, waLink, telLink, formatINR } from "@/lib/brand";
import { Image as Img } from "@/components/ui/image";
import { SERVICES } from "@/data/siteData";

export default function ServiceDetail(props) {
    const routeParams = useParams();
    const slug = props.slug || routeParams?.slug;
    const initialItem = props.service || SERVICES.find((s) => s.slug === slug || s.id === slug) || null;
    const [item, setItem] = useState(initialItem);
    const [related, setRelated] = useState(
        initialItem ? SERVICES.filter((s) => s.category === initialItem.category && s.id !== initialItem.id).slice(0, 3) : []
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const all = await api.entities.Service.list("-sort_order", 100);
                const found = all.find((s) => s.slug === slug || s.id === slug);
                if (found) {
                    setItem(found);
                    setRelated(all.filter((s) => s.category === found.category && s.id !== found.id).slice(0, 3));
                }
            } catch (e) { }
            setLoading(false);
        })();
    }, [slug]);

    if (loading) return <div className="py-24 text-center text-ink-soft">Loading...</div>;
    if (!item) return <div className="py-24 text-center"><p className="text-ink-soft">Service not found.</p><Link to="/services" className="mt-4 inline-block text-rk-red font-semibold">← Back to services</Link></div>;

    return (
        <div>
            <section className="bg-ink text-white py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="grid lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <Link to="/services" className="text-xs text-white/50 hover:text-white">← Services</Link>
                            <span className="block mt-3 text-xs font-semibold tracking-wider text-rk-red">{item.category}</span>
                            <h1 className="mt-2 font-heading font-extrabold text-3xl sm:text-4xl">{item.title}</h1>
                            <p className="mt-4 text-white/60 max-w-lg">{item.short_description}</p>
                            {item.starting_price ? <p className="mt-5 text-2xl font-extrabold text-rk-red">From {formatINR(item.starting_price)}</p> : null}
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link to="/get-quote" className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-5 py-3 text-sm font-semibold text-white">Get Custom Quote <ArrowRight className="h-4 w-4" /></Link>
                                <a href={waLink(`I'm interested in ${item.title}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                            </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-video">{item.image_url && <Img src={item.image_url} alt={item.title} className="w-full h-full" fittingType="fill" />}</div>
                    </div>
                </div>
            </section>

            <section className="py-14 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        {item.description && <div><h2 className="font-heading font-bold text-xl mb-3">Overview</h2><p className="text-ink-soft leading-relaxed">{item.description}</p></div>}
                        {item.benefits?.length > 0 && <div><h2 className="font-heading font-bold text-xl mb-3">Benefits</h2><ul className="space-y-2">{item.benefits.map((b, i) => <li key={i} className="flex gap-2.5"><Check className="h-5 w-5 text-rk-red shrink-0" /><span className="text-ink-soft">{b}</span></li>)}</ul></div>}
                        <div className="grid sm:grid-cols-2 gap-6">
                            {item.options?.length > 0 && <Info title="Available Options" items={item.options} />}
                            {item.sizes?.length > 0 && <Info title="Sizes" items={item.sizes} />}
                            {item.materials?.length > 0 && <Info title="Materials" items={item.materials} />}
                            {item.finishing?.length > 0 && <Info title="Finishing" items={item.finishing} />}
                        </div>
                        {item.faqs?.length > 0 && <div><h2 className="font-heading font-bold text-xl mb-4">FAQs</h2><div className="space-y-3">{item.faqs.map((f, i) => <div key={i} className="rounded-xl border border-black/8 p-4"><p className="font-semibold text-sm text-ink">{f.q}</p><p className="mt-1 text-sm text-ink-soft">{f.a}</p></div>)}</div></div>}
                    </div>
                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-black/8 p-6 sticky top-20">
                            <p className="font-heading font-bold text-lg">Ready to order?</p>
                            <p className="mt-1 text-sm text-ink-soft">Get a custom quote tailored to your needs.</p>
                            <Link to="/get-quote" className="mt-4 block text-center rounded-lg bg-rk-red px-5 py-3 text-sm font-semibold text-white">Get a Quote</Link>
                            <a href={waLink(`I'm interested in ${item.title}`)} target="_blank" rel="noreferrer" className="mt-2 block text-center rounded-lg border border-black/15 px-5 py-3 text-sm font-semibold text-ink hover:bg-muted">WhatsApp Us</a>
                            <a href={telLink()} className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-rk-red"><Phone className="h-4 w-4" /> {BRAND.phone1}</a>
                        </div>
                    </aside>
                </div>
            </section>

            {related.length > 0 && (
                <section className="py-12 bg-muted/40">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <h2 className="font-heading font-bold text-2xl mb-6">Related Services</h2>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {related.map((r) => <Link key={r.id} to={`/services/${r.slug || r.id}`} className="rounded-xl border border-black/8 p-5 bg-white hover:shadow-md transition"><span className="text-[10px] font-semibold tracking-wider text-rk-red">{r.category}</span><p className="mt-1 font-heading font-bold">{r.title}</p><p className="mt-1 text-xs text-ink-soft line-clamp-2">{r.short_description}</p></Link>)}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

function Info({ title, items }) {
    return <div><h3 className="font-semibold text-sm text-ink mb-2">{title}</h3><ul className="space-y-1.5">{items.map((o, i) => <li key={i} className="text-sm text-ink-soft flex gap-2"><span className="text-rk-red">•</span>{o}</li>)}</ul></div>;
}