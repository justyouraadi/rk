import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Search, X } from "lucide-react";
import { formatINR } from "@/lib/brand";

export default function AdminCustomers() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [sel, setSel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { (async () => { try { setItems(await api.entities.Customer.list("-created_date", 200)); } catch (e) { } setLoading(false); })(); }, []);
    const filtered = items.filter(c => !q || (c.name + c.phone + c.business_name).toLowerCase().includes(q.toLowerCase()));

    return (
        <div className="space-y-5">
            <div><h1 className="font-heading font-extrabold text-2xl text-ink">Customers</h1><p className="text-sm text-ink-soft">{filtered.length} customers</p></div>
            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10 max-w-sm" placeholder="Search customers..." value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading...</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No customers yet.</p> : (
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr><th className="text-left px-4 py-3 font-semibold">Customer ID</th><th className="text-left px-4 py-3 font-semibold">Name</th><th className="text-left px-4 py-3 font-semibold">Phone</th><th className="text-left px-4 py-3 font-semibold">Business</th><th className="text-left px-4 py-3 font-semibold">Orders</th><th className="text-left px-4 py-3 font-semibold">Revenue</th></tr></thead>
                        <tbody className="divide-y divide-black/5">
                            {filtered.map(c => (
                                <tr key={c.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSel(c)}>
                                    <td className="px-4 py-3 font-mono text-xs">{c.customer_id || "—"}</td>
                                    <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                                    <td className="px-4 py-3 text-ink-soft">{c.phone}</td>
                                    <td className="px-4 py-3 text-ink-soft">{c.business_name || "—"}</td>
                                    <td className="px-4 py-3">{c.total_orders || 0}</td>
                                    <td className="px-4 py-3">{formatINR(c.total_revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>

            {sel && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setSel(null)} />
                    <div className="relative w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between"><h2 className="font-heading font-bold text-lg">{sel.name}</h2><button onClick={() => setSel(null)}><X className="h-5 w-5" /></button></div>
                        <div className="space-y-2 text-sm">
                            <Row k="Phone" v={sel.phone} /><Row k="WhatsApp" v={sel.whatsapp} /><Row k="Email" v={sel.email} /><Row k="Business" v={sel.business_name} /><Row k="Address" v={sel.address} /><Row k="GST" v={sel.gst_number} /><Row k="Total Orders" v={sel.total_orders} /><Row k="Total Revenue" v={formatINR(sel.total_revenue)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
function Row({ k, v }) { return <div className="flex justify-between gap-3"><span className="text-ink-soft shrink-0">{k}</span><span className="font-medium text-ink text-right">{v || "—"}</span></div>; }