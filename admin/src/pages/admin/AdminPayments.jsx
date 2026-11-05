import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, X, Loader2, Wallet } from "lucide-react";
import { formatINR, genId } from "@/lib/brand";

const METHODS = ["UPI", "BANK_TRANSFER", "CASH", "ONLINE"];

export default function AdminPayments() {
    const { toast } = useToast();
    const [payments, setPayments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [q, setQ] = useState("");
    const [show, setShow] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ order_id: "", amount: 0, method: "UPI", transaction_ref: "", note: "" });

    const load = async () => { setLoading(true); try { const [p, o] = await Promise.all([api.entities.Payment.list("-created_date", 200), api.entities.Order.list("-created_date", 200)]); setPayments(p); setOrders(o); } catch (e) { } setLoading(false); };
    useEffect(() => { load(); }, []);

    const filtered = payments.filter(p => !q || (p.payment_number + p.customer_name).toLowerCase().includes(q.toLowerCase()));
    const totalCollected = payments.filter(p => p.status === "SUCCESS").reduce((s, p) => s + (p.amount || 0), 0);

    const record = async () => {
        const order = orders.find(o => o.id === form.order_id);
        if (!order) { toast({ title: "Select an order", variant: "destructive" }); return; }
        setSaving(true);
        try {
            await api.entities.Payment.create({
                payment_number: genId("PAY"), order_id: order.id, customer_id: order.customer_id, customer_name: order.customer_name,
                amount: form.amount, method: form.method, status: "SUCCESS", transaction_ref: form.transaction_ref, note: form.note,
            });
            const newPaid = (order.paid_amount || 0) + form.amount;
            const newPending = order.total_amount - newPaid;
            const payStatus = newPending <= 0 ? "PAID" : "PARTIAL";
            await api.entities.Order.update(order.id, { paid_amount: newPaid, pending_amount: Math.max(0, newPending), payment_status: payStatus });
            toast({ title: "Payment recorded" }); setShow(false); load();
            setForm({ order_id: "", amount: 0, method: "UPI", transaction_ref: "", note: "" });
        } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Payments</h1><p className="text-sm text-ink-soft">Total collected: <span className="font-bold text-ink">{formatINR(totalCollected)}</span></p></div>
                <button onClick={() => setShow(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Record Payment</button>
            </div>

            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10 max-w-sm" placeholder="Search payments..." value={q} onChange={e => setQ(e.target.value)} /></div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading...</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No payments recorded.</p> : (
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr><th className="text-left px-4 py-3 font-semibold">Payment #</th><th className="text-left px-4 py-3 font-semibold">Customer</th><th className="text-left px-4 py-3 font-semibold">Amount</th><th className="text-left px-4 py-3 font-semibold">Method</th><th className="text-left px-4 py-3 font-semibold">Status</th><th className="text-left px-4 py-3 font-semibold">Date</th></tr></thead>
                        <tbody className="divide-y divide-black/5">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-mono text-xs">{p.payment_number}</td>
                                    <td className="px-4 py-3 font-semibold text-ink">{p.customer_name}</td>
                                    <td className="px-4 py-3 font-bold">{formatINR(p.amount)}</td>
                                    <td className="px-4 py-3"><span className="text-xs rounded-full bg-muted px-2 py-0.5">{(p.method || "").replace(/_/g, " ")}</span></td>
                                    <td className="px-4 py-3"><span className={`text-xs font-bold ${p.status === "SUCCESS" ? "text-green-600" : "text-ink-soft"}`}>{p.status}</span></td>
                                    <td className="px-4 py-3 text-xs text-ink-soft">{new Date(p.created_date).toLocaleDateString("en-IN")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>

            {show && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShow(false)} />
                    <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between"><h2 className="font-heading font-bold text-lg">Record Payment</h2><button onClick={() => setShow(false)}><X className="h-5 w-5" /></button></div>
                        <div className="p-5 space-y-4">
                            <div><label className="block text-sm font-semibold mb-1.5">Select Order</label><select className="rk-input" value={form.order_id} onChange={e => { const o = orders.find(x => x.id === e.target.value); setForm({ ...form, order_id: e.target.value, amount: o ? o.pending_amount : 0 }); }}><option value="">Choose order...</option>{orders.map(o => <option key={o.id} value={o.id}>{o.order_number} — {o.customer_name} (Pending: {formatINR(o.pending_amount)})</option>)}</select></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Amount (₹)</label><input type="number" className="rk-input" value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} /></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Method</label><select className="rk-input" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>{METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}</select></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Transaction Reference</label><input className="rk-input" value={form.transaction_ref} onChange={e => setForm({ ...form, transaction_ref: e.target.value })} /></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Note</label><input className="rk-input" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
                            <button onClick={record} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />} Record Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}