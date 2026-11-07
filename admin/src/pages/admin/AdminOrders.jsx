import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, X, ChevronRight } from "lucide-react";
import { ORDER_STATUSES, formatINR } from "@/lib/brand";

export default function AdminOrders() {
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sel, setSel] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => { setLoading(true); try { setOrders(await api.entities.Order.list("-created_date", 200)); } catch (e) { } setLoading(false); };
    useEffect(() => { load(); }, []);

    const filtered = orders.filter(o =>
        (statusFilter === "ALL" || (o.status || o.order_status) === statusFilter) &&
        (!q || (o.order_number + " " + (o.customer_name || "") + " " + (o.customer_phone || "")).toLowerCase().includes(q.toLowerCase()))
    );

    const advance = async (o) => {
        const curStatus = o.status || o.order_status || "PLACED";
        const idx = ORDER_STATUSES.indexOf(curStatus);
        const next = ORDER_STATUSES[Math.min(idx + 1, ORDER_STATUSES.length - 1)];
        const history = [...(o.status_history || []), { status: next, timestamp: new Date().toISOString(), note: "Status advanced" }];
        try {
            await api.entities.Order.update(o.id, { status: next, order_status: next, status_history: history });
            toast({ title: `Moved to ${next.replace(/_/g, " ")}` });
            load(); setSel({ ...o, status: next, order_status: next, status_history: history });
        } catch (e) { toast({ title: "Failed to advance status", description: e.message, variant: "destructive" }); }
    };

    const changeStatus = async (o, st) => {
        const history = [...(o.status_history || []), { status: st, timestamp: new Date().toISOString(), note: "Manual status update" }];
        try {
            await api.entities.Order.update(o.id, { status: st, order_status: st, status_history: history });
            toast({ title: `Status updated to ${st}` });
            load(); setSel({ ...o, status: st, order_status: st, status_history: history });
        } catch (e) { toast({ title: "Failed to update status", description: e.message, variant: "destructive" }); }
    };

    return (
        <div className="space-y-5">
            <div><h1 className="font-heading font-extrabold text-2xl text-ink">Orders</h1><p className="text-sm text-ink-soft">{filtered.length} orders</p></div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10" placeholder="Search order ID, customer..." value={q} onChange={e => setQ(e.target.value)} /></div>
                <select className="rk-input sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">All Status</option>{ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
            </div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading...</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No orders found.</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider">
                                <tr><th className="text-left px-4 py-3 font-semibold">Order #</th><th className="text-left px-4 py-3 font-semibold">Customer</th><th className="text-left px-4 py-3 font-semibold">Total</th><th className="text-left px-4 py-3 font-semibold">Paid</th><th className="text-left px-4 py-3 font-semibold">Status</th><th className="text-left px-4 py-3 font-semibold">Priority</th></tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {filtered.map(o => (
                                    <tr key={o.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSel(o)}>
                                        <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                                        <td className="px-4 py-3 font-semibold text-ink">{o.customer_name}</td>
                                        <td className="px-4 py-3">{formatINR(o.total_amount)}</td>
                                        <td className="px-4 py-3"><span className={o.payment_status === "PAID" ? "text-green-600 font-semibold" : ""}>{formatINR(o.paid_amount)}</span></td>
                                        <td className="px-4 py-3"><OrderBadge status={o.status} /></td>
                                        <td className="px-4 py-3"><PriorityBadge p={o.priority} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {sel && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setSel(null)} />
                    <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-heading font-bold text-lg text-ink">{sel.order_number}</h2>
                                <p className="text-xs text-ink-soft">
                                    Date: {new Date(sel.created_date || sel.createdAt).toLocaleDateString("en-IN")}
                                </p>
                            </div>
                            <button onClick={() => setSel(null)}><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-5 space-y-5">
                            {/* Customer Details */}
                            <div className="rounded-xl border border-black/8 p-3.5 bg-muted/20 text-sm space-y-1">
                                <p className="font-bold text-ink">{sel.customer_name || "Guest Customer"}</p>
                                {sel.customer_phone && <p className="text-xs text-ink-soft">Phone: {sel.customer_phone}</p>}
                                {sel.customer_email && <p className="text-xs text-ink-soft">Email: {sel.customer_email}</p>}
                                {sel.shipping_address && (
                                    <p className="text-xs text-ink-soft pt-1 border-t border-black/6">
                                        Ship to: {sel.shipping_address}
                                    </p>
                                )}
                            </div>

                            {/* Financial Summary */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-ink-soft">Total Amount</p><p className="font-bold">{formatINR(sel.total_amount)}</p></div>
                                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-ink-soft">Paid</p><p className="font-bold text-emerald-600">{formatINR(sel.paid_amount)}</p></div>
                                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-ink-soft">Pending</p><p className="font-bold text-rk-red">{formatINR(sel.pending_amount)}</p></div>
                                <div className="rounded-lg bg-muted p-3"><p className="text-xs text-ink-soft">Priority</p><p className="font-bold capitalize">{sel.priority || "NORMAL"}</p></div>
                            </div>

                            {/* Line Items */}
                            {Array.isArray(sel.items) && sel.items.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Order Items</p>
                                    <div className="rounded-lg border border-black/8 divide-y divide-black/5 text-xs">
                                        {sel.items.map((it, idx) => (
                                            <div key={idx} className="p-2.5 flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-ink">{it.description || it.name || "Print Product"}</p>
                                                    <p className="text-ink-soft">Qty: {it.quantity} {it.rate ? `× ${formatINR(it.rate)}` : ""}</p>
                                                </div>
                                                <p className="font-bold text-ink">{formatINR(it.amount || (it.quantity * (it.rate || 0)))}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm font-semibold mb-2">Order Tracker</p>
                                <div className="space-y-1">
                                    {ORDER_STATUSES.map((s, i) => {
                                        const curStatus = sel.status || sel.order_status || "PLACED";
                                        const cur = ORDER_STATUSES.indexOf(curStatus);
                                        return (
                                            <div key={s} className="flex items-center gap-2.5">
                                                <div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${i <= cur ? "bg-rk-red text-white" : "bg-muted text-ink-soft"}`}>{i < cur ? "✓" : i + 1}</div>
                                                <span className={`text-sm ${i <= cur ? "text-ink font-medium" : "text-ink-soft"}`}>{s.replace(/_/g, " ")}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold mb-2">Set Status</p>
                                <select className="rk-input" value={sel.status || sel.order_status} onChange={e => changeStatus(sel, e.target.value)}>
                                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                                </select>
                            </div>

                            <button onClick={() => advance(sel)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold hover:opacity-90 transition">
                                Advance to Next Stage <ChevronRight className="h-4 w-4" />
                            </button>

                            {(sel.status_history || []).length > 0 && (
                                <div><p className="text-sm font-semibold mb-2">Timeline</p>
                                    <div className="space-y-2">{[...sel.status_history].reverse().map((h, i) => <div key={i} className="text-xs border-l-2 border-rk-red pl-3 py-1"><p className="font-semibold text-ink">{h.status.replace(/_/g, " ")}</p><p className="text-ink-soft">{new Date(h.timestamp).toLocaleString("en-IN")}</p></div>)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OrderBadge({ status }) {
    const s = status || "PLACED";
    const cur = ORDER_STATUSES.indexOf(s);
    const color = s === "COMPLETED" || s === "DELIVERED"
        ? "bg-emerald-100 text-emerald-800"
        : s === "DISPATCHED" || s === "READY"
        ? "bg-blue-100 text-blue-700"
        : cur >= 4
        ? "bg-amber-100 text-amber-800"
        : "bg-rk-red/10 text-rk-red";
    return <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${color}`}>{s.replace(/_/g, " ")}</span>;
}
function PriorityBadge({ p }) {
    const map = { URGENT: "bg-red-100 text-red-700", HIGH: "bg-orange-100 text-orange-700", NORMAL: "bg-muted text-ink-soft" };
    return <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${map[p] || map.NORMAL}`}>{p || "NORMAL"}</span>;
}