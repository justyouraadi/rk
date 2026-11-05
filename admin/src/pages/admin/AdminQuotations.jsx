import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, X, Plus, Trash2, FileDown, Send } from "lucide-react";
import { formatINR, genId } from "@/lib/brand";

const QSTATUS = ["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"];

export default function AdminQuotations() {
    const { toast } = useToast();
    const [quotes, setQuotes] = useState([]);
    const [leads, setLeads] = useState([]);
    const [q, setQ] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ lead_id: "", items: [{ description: "", quantity: 1, rate: 0 }], discount: 0, gst_percent: 18, delivery_charges: 0, other_charges: 0, notes: "" });

    const load = async () => { setLoading(true); try { const [qs, ls] = await Promise.all([api.entities.Quotation.list("-created_date", 200), api.entities.Lead.list("-created_date", 200)]); setQuotes(qs); setLeads(ls); } catch (e) { } setLoading(false); };
    useEffect(() => { load(); }, []);

    const filtered = quotes.filter(qu => !q || (qu.quotation_number + qu.customer_name).toLowerCase().includes(q.toLowerCase()));

    const setItem = (i, k, v) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v, amount: (k === "quantity" ? v : items[i].quantity) * (k === "rate" ? v : items[i].rate) }; return { ...f, items }; });
    const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: 1, rate: 0 }] }));
    const rmItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));

    const calc = () => {
        const subtotal = form.items.reduce((s, it) => s + (it.quantity * it.rate || 0), 0);
        const afterDiscount = subtotal - (form.discount || 0);
        const gst = afterDiscount * (form.gst_percent || 0) / 100;
        const total = afterDiscount + gst + (form.delivery_charges || 0) + (form.other_charges || 0);
        return { subtotal, gst_amount: gst, total };
    };

    const create = async () => {
        const lead = leads.find(l => l.id === form.lead_id);
        if (!lead) { toast({ title: "Select a lead", variant: "destructive" }); return; }
        const { subtotal, gst_amount, total } = calc();
        try {
            await api.entities.Quotation.create({
                quotation_number: genId("QT"), lead_id: lead.id, customer_name: lead.name,
                items: form.items, subtotal, discount: form.discount, gst_percent: form.gst_percent, gst_amount,
                delivery_charges: form.delivery_charges, other_charges: form.other_charges, total,
                status: "DRAFT", notes: form.notes, valid_until: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
            });
            await api.entities.Lead.update(lead.id, { status: "QUOTE_SENT" }).catch(() => { });
            toast({ title: "Quotation created" }); setShowForm(false); load();
            setForm({ lead_id: "", items: [{ description: "", quantity: 1, rate: 0 }], discount: 0, gst_percent: 18, delivery_charges: 0, other_charges: 0, notes: "" });
        } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    };

    const updateStatus = async (id, st) => { try { await api.entities.Quotation.update(id, { status: st }); toast({ title: "Status updated" }); load(); } catch (e) { toast({ title: "Failed", variant: "destructive" }); } };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Quotations</h1><p className="text-sm text-ink-soft">{filtered.length} quotations</p></div>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> New Quote</button>
            </div>

            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10 max-w-sm" placeholder="Search quotations..." value={q} onChange={e => setQ(e.target.value)} /></div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading...</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No quotations yet.</p> : (
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr><th className="text-left px-4 py-3 font-semibold">Quote #</th><th className="text-left px-4 py-3 font-semibold">Customer</th><th className="text-left px-4 py-3 font-semibold">Total</th><th className="text-left px-4 py-3 font-semibold">Status</th><th className="text-left px-4 py-3 font-semibold">Date</th></tr></thead>
                        <tbody className="divide-y divide-black/5">
                            {filtered.map(qu => (
                                <tr key={qu.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-mono text-xs">{qu.quotation_number}</td>
                                    <td className="px-4 py-3 font-semibold text-ink">{qu.customer_name}</td>
                                    <td className="px-4 py-3">{formatINR(qu.total)}</td>
                                    <td className="px-4 py-3"><span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${qu.status === "ACCEPTED" ? "bg-green-100 text-green-700" : qu.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-muted text-ink-soft"}`}>{qu.status}</span></td>
                                    <td className="px-4 py-3 text-xs text-ink-soft">{new Date(qu.created_date).toLocaleDateString("en-IN")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between"><h2 className="font-heading font-bold text-lg">New Quotation</h2><button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button></div>
                        <div className="p-5 space-y-4">
                            <div><label className="block text-sm font-semibold mb-1.5">Select Lead</label><select className="rk-input" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}><option value="">Choose a lead...</option>{leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.service || "General"}</option>)}</select></div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between"><label className="text-sm font-semibold">Items</label><button onClick={addItem} className="text-xs font-semibold text-rk-red flex items-center gap-1"><Plus className="h-3 w-3" />Add</button></div>
                                {form.items.map((it, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                        <input className="rk-input col-span-6" placeholder="Description" value={it.description} onChange={e => setItem(i, "description", e.target.value)} />
                                        <input type="number" className="rk-input col-span-2" placeholder="Qty" value={it.quantity} onChange={e => setItem(i, "quantity", +e.target.value)} />
                                        <input type="number" className="rk-input col-span-3" placeholder="Rate" value={it.rate} onChange={e => setItem(i, "rate", +e.target.value)} />
                                        <button onClick={() => rmItem(i)} className="col-span-1 grid place-items-center text-ink-soft hover:text-rk-red"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-sm font-semibold mb-1.5">Discount (₹)</label><input type="number" className="rk-input" value={form.discount} onChange={e => setForm({ ...form, discount: +e.target.value })} /></div>
                                <div><label className="block text-sm font-semibold mb-1.5">GST %</label><input type="number" className="rk-input" value={form.gst_percent} onChange={e => setForm({ ...form, gst_percent: +e.target.value })} /></div>
                                <div><label className="block text-sm font-semibold mb-1.5">Delivery Charges</label><input type="number" className="rk-input" value={form.delivery_charges} onChange={e => setForm({ ...form, delivery_charges: +e.target.value })} /></div>
                                <div><label className="block text-sm font-semibold mb-1.5">Other Charges</label><input type="number" className="rk-input" value={form.other_charges} onChange={e => setForm({ ...form, other_charges: +e.target.value })} /></div>
                            </div>
                            <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span className="font-semibold">{formatINR(calc().subtotal)}</span></div>
                                <div className="flex justify-between"><span className="text-ink-soft">GST ({form.gst_percent}%)</span><span className="font-semibold">{formatINR(calc().gst_amount)}</span></div>
                                <div className="flex justify-between border-t border-black/10 pt-1 mt-1"><span className="font-bold">Total</span><span className="font-extrabold text-rk-red">{formatINR(calc().total)}</span></div>
                            </div>
                            <div><label className="block text-sm font-semibold mb-1.5">Notes</label><textarea className="rk-input min-h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                            <button onClick={create} className="w-full rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold">Create Quotation</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}