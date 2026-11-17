import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, X, ChevronRight, CheckCircle2, AlertCircle, Clock, ShieldCheck, Filter } from "lucide-react";
import { ORDER_STATUSES, formatINR } from "@/lib/brand";

function isOrderApproved(order) {
    if (!order) return false;
    const history = Array.isArray(order.status_history) ? order.status_history : [];
    return history.some((h) => h.status === "APPROVED" || h.status === "DESIGN_APPROVAL" || h.status === "PRINTING");
}

export default function AdminOrders() {
    const { toast } = useToast();
    const [orders, setOrders] = useState([]);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sel, setSel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState("");
    const [nextStatusChoice, setNextStatusChoice] = useState("DESIGN_APPROVAL");

    const load = async () => {
        setLoading(true);
        try {
            setOrders(await api.entities.Order.list("-created_date", 200));
        } catch (e) {
            console.error("Failed to load orders:", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = orders.filter((o) => {
        const curStatus = o.status || o.order_status;
        const approved = isOrderApproved(o);

        let matchesStatus = true;
        if (statusFilter === "AWAITING_APPROVAL") {
            matchesStatus = !approved && (curStatus === "PLACED" || curStatus === "NEW");
        } else if (statusFilter !== "ALL") {
            matchesStatus = curStatus === statusFilter;
        }

        const matchesQuery = !q || (
            o.order_number + " " +
            (o.customer_name || "") + " " +
            (o.customer_phone || "") + " " +
            (o.customer_email || "")
        ).toLowerCase().includes(q.toLowerCase());

        return matchesStatus && matchesQuery;
    });

    const awaitingApprovalCount = orders.filter((o) => !isOrderApproved(o) && ((o.status || o.order_status) === "PLACED" || (o.status || o.order_status) === "NEW")).length;

    const handleApproveOrder = async (order) => {
        setApproving(true);
        try {
            const approvedOrder = await api.entities.Order.approve(order.id, {
                notes: approvalNotes.trim() || "Order specifications verified and approved by admin. Dispatched to production.",
                approvedBy: "Admin",
                nextStatus: nextStatusChoice,
            });

            toast({
                title: "Order Approved!",
                description: `Order ${order.order_number} approved and moved to ${nextStatusChoice.replace(/_/g, " ")}. Customer notified.`,
            });

            setApprovalNotes("");
            await load();
            setSel(approvedOrder);
        } catch (err) {
            console.error("Failed to approve order:", err);
            toast({
                title: "Approval Failed",
                description: err.message || "Could not approve order",
                variant: "destructive",
            });
        } finally {
            setApproving(false);
        }
    };

    const advance = async (o) => {
        const curStatus = o.status || o.order_status || "PLACED";
        const idx = ORDER_STATUSES.indexOf(curStatus);
        const next = ORDER_STATUSES[Math.min(idx + 1, ORDER_STATUSES.length - 1)];
        const history = [...(o.status_history || []), { status: next, timestamp: new Date().toISOString(), note: "Status advanced by admin" }];
        try {
            const updated = await api.entities.Order.update(o.id, { status: next, order_status: next, status_history: history });
            toast({ title: `Moved to ${next.replace(/_/g, " ")}` });
            load();
            setSel(updated);
        } catch (e) {
            toast({ title: "Failed to advance status", description: e.message, variant: "destructive" });
        }
    };

    const changeStatus = async (o, st) => {
        const history = [...(o.status_history || []), { status: st, timestamp: new Date().toISOString(), note: `Manual status change to ${st}` }];
        try {
            const updated = await api.entities.Order.update(o.id, { status: st, order_status: st, status_history: history });
            toast({ title: `Status updated to ${st.replace(/_/g, " ")}` });
            load();
            setSel(updated);
        } catch (e) {
            toast({ title: "Failed to update status", description: e.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="font-heading font-extrabold text-2xl text-ink">Orders</h1>
                    <p className="text-sm text-ink-soft">
                        {filtered.length} orders total
                        {awaitingApprovalCount > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs">
                                <AlertCircle className="h-3 w-3" /> {awaitingApprovalCount} pending approval
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" />
                    <input
                        className="rk-input pl-10"
                        placeholder="Search order ID, customer name, phone..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>
                <select
                    className="rk-input sm:w-56"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Orders</option>
                    <option value="AWAITING_APPROVAL">⚠️ Awaiting Approval ({awaitingApprovalCount})</option>
                    {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden shadow-sm">
                {loading ? (
                    <p className="p-8 text-center text-ink-soft">Loading orders...</p>
                ) : filtered.length === 0 ? (
                    <p className="p-8 text-center text-ink-soft">No orders found matching criteria.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold">Order #</th>
                                    <th className="text-left px-4 py-3 font-semibold">Customer</th>
                                    <th className="text-left px-4 py-3 font-semibold">Total</th>
                                    <th className="text-left px-4 py-3 font-semibold">Paid</th>
                                    <th className="text-left px-4 py-3 font-semibold">Approval & Status</th>
                                    <th className="text-left px-4 py-3 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {filtered.map((o) => {
                                    const approved = isOrderApproved(o);
                                    return (
                                        <tr
                                            key={o.id}
                                            className="hover:bg-muted/30 cursor-pointer transition"
                                            onClick={() => setSel(o)}
                                        >
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">
                                                {o.order_number}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-ink">{o.customer_name}</p>
                                                <p className="text-xs text-ink-soft">{o.customer_phone}</p>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-ink">{formatINR(o.total_amount)}</td>
                                            <td className="px-4 py-3">
                                                <span className={o.payment_status === "PAID" ? "text-emerald-700 font-semibold" : "text-ink-soft"}>
                                                    {formatINR(o.paid_amount)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {!approved ? (
                                                        <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> Awaiting Approval
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                            <ShieldCheck className="h-3 w-3" /> Approved
                                                        </span>
                                                    )}
                                                    <OrderBadge status={o.status || o.order_status} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {!approved ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSel(o);
                                                        }}
                                                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 shadow-sm transition"
                                                    >
                                                        Review & Approve
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-ink-soft">View Details →</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Detail Drawer */}
            {sel && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSel(null)} />
                    <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
                                    {sel.order_number}
                                    {!isOrderApproved(sel) ? (
                                        <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                                            Awaiting Approval
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                                            Approved
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-ink-soft">
                                    Date: {new Date(sel.created_date || sel.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                            <button onClick={() => setSel(null)} className="p-1 rounded-md text-ink-soft hover:text-ink hover:bg-muted">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 flex-1">
                            {/* APPROVAL WORKFLOW CARD */}
                            {!isOrderApproved(sel) ? (
                                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 space-y-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
                                            <AlertCircle className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-sm text-amber-950">
                                                Admin Approval Required
                                            </h3>
                                            <p className="text-xs text-amber-800 mt-0.5">
                                                This order has been placed by the customer. Verify customer files and approve it to move it into active production.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-1 text-xs">
                                        <label className="block font-semibold text-ink">
                                            Production Queue / Next Status:
                                        </label>
                                        <select
                                            className="rk-input text-xs py-1.5"
                                            value={nextStatusChoice}
                                            onChange={(e) => setNextStatusChoice(e.target.value)}
                                        >
                                            <option value="DESIGN_APPROVAL">Design Approval & Proofing</option>
                                            <option value="PRINTING">Printing in Progress (Direct Press)</option>
                                            <option value="DESIGN_IN_PROGRESS">Design in Progress</option>
                                        </select>

                                        <label className="block font-semibold text-ink pt-1">
                                            Approval Notes / Instructions (Optional):
                                        </label>
                                        <input
                                            className="rk-input text-xs py-1.5"
                                            placeholder="e.g. Artwork verified. 500 pcs scheduled on Heidelberg press."
                                            value={approvalNotes}
                                            onChange={(e) => setApprovalNotes(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleApproveOrder(sel)}
                                        disabled={approving}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-sm font-semibold shadow-md transition disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {approving ? "Approving Order..." : "Approve Order & Notify Customer"}
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center justify-between text-xs text-emerald-900">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                        <div>
                                            <p className="font-bold">Order Approved by Admin</p>
                                            <p className="text-[11px] text-emerald-700">Currently in active production queue.</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                        Active
                                    </span>
                                </div>
                            )}

                            {/* Customer Details */}
                            <div className="rounded-xl border border-black/8 p-4 bg-muted/20 text-sm space-y-1.5">
                                <p className="font-bold text-ink text-base">{sel.customer_name || "Guest Customer"}</p>
                                {sel.customer_phone && <p className="text-xs text-ink-soft">Phone: <strong className="text-ink">{sel.customer_phone}</strong></p>}
                                {sel.customer_email && <p className="text-xs text-ink-soft">Email: <strong className="text-ink">{sel.customer_email}</strong></p>}
                                {sel.shipping_address && (
                                    <p className="text-xs text-ink-soft pt-1.5 border-t border-black/6">
                                        Delivery Address: <strong className="text-ink">{sel.shipping_address}</strong>
                                    </p>
                                )}
                                {sel.notes && (
                                    <p className="text-xs text-ink-soft pt-1 border-t border-black/6">
                                        Customer Notes: <span className="italic text-ink">{sel.notes}</span>
                                    </p>
                                )}
                            </div>

                            {/* Financial Summary */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-xl bg-muted p-3">
                                    <p className="text-xs text-ink-soft">Total Amount</p>
                                    <p className="font-extrabold text-base text-ink">{formatINR(sel.total_amount)}</p>
                                </div>
                                <div className="rounded-xl bg-muted p-3">
                                    <p className="text-xs text-ink-soft">Paid</p>
                                    <p className="font-extrabold text-base text-emerald-600">{formatINR(sel.paid_amount)}</p>
                                </div>
                                <div className="rounded-xl bg-muted p-3">
                                    <p className="text-xs text-ink-soft">Pending</p>
                                    <p className="font-extrabold text-base text-rk-red">{formatINR(sel.pending_amount)}</p>
                                </div>
                                <div className="rounded-xl bg-muted p-3">
                                    <p className="text-xs text-ink-soft">Payment Status</p>
                                    <p className="font-extrabold text-base capitalize text-ink">{sel.payment_status || "PENDING"}</p>
                                </div>
                            </div>

                            {/* Line Items */}
                            {Array.isArray(sel.items) && sel.items.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Order Items</p>
                                    <div className="rounded-xl border border-black/8 divide-y divide-black/5 text-xs">
                                        {sel.items.map((it, idx) => (
                                            <div key={idx} className="p-3 flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-ink">{it.name || it.description || "Print Product"}</p>
                                                    {it.specifications && <p className="text-ink-soft text-[11px]">{it.specifications}</p>}
                                                    <p className="text-ink-soft text-[11px]">Qty: {it.quantity} {it.rate ? `× ${formatINR(it.rate)}` : ""}</p>
                                                </div>
                                                <p className="font-bold text-ink">{formatINR(it.amount || (it.quantity * (it.rate || 0)))}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Order Production Tracker */}
                            <div>
                                <p className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Order Tracker</p>
                                <div className="space-y-1.5 rounded-xl border border-black/8 p-3 bg-muted/10">
                                    {ORDER_STATUSES.map((s, i) => {
                                        const curStatus = sel.status || sel.order_status || "PLACED";
                                        const cur = ORDER_STATUSES.indexOf(curStatus);
                                        return (
                                            <div key={s} className="flex items-center gap-2.5">
                                                <div className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${i <= cur ? "bg-rk-red text-white" : "bg-muted text-ink-soft"}`}>
                                                    {i < cur ? "✓" : i + 1}
                                                </div>
                                                <span className={`text-xs ${i <= cur ? "text-ink font-semibold" : "text-ink-soft"}`}>
                                                    {s.replace(/_/g, " ")}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Set Status Manual Override */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-ink uppercase tracking-wider">Set Stage Manually</p>
                                <select
                                    className="rk-input text-xs"
                                    value={sel.status || sel.order_status}
                                    onChange={(e) => changeStatus(sel, e.target.value)}
                                >
                                    {ORDER_STATUSES.map((s) => (
                                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => advance(sel)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-rk-red text-white py-2.5 text-xs font-semibold hover:opacity-90 transition"
                                >
                                    Advance to Next Stage <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Timeline */}
                            {(sel.status_history || []).length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-ink uppercase tracking-wider mb-2">History & Audit Log</p>
                                    <div className="space-y-2 rounded-xl border border-black/8 p-3 bg-muted/20">
                                        {[...sel.status_history].reverse().map((h, i) => (
                                            <div key={i} className="text-xs border-l-2 border-rk-red pl-3 py-1">
                                                <p className="font-semibold text-ink">{h.label || h.status.replace(/_/g, " ")}</p>
                                                {h.note && <p className="text-ink-soft text-[11px] mt-0.5">{h.note}</p>}
                                                <p className="text-ink-soft text-[10px] mt-0.5">{new Date(h.timestamp).toLocaleString("en-IN")}</p>
                                            </div>
                                        ))}
                                    </div>
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
    return <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${color}`}>{s.replace(/_/g, " ")}</span>;
}
