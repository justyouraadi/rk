import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { User, FileText, ClipboardList, ShoppingCart, Wallet, MessageCircle, Package, Clock } from "lucide-react";
import { BRAND, waLink, formatINR, ORDER_STATUSES } from "@/lib/brand";

const TABS = [
    { k: "profile", l: "My Profile", i: User },
    { k: "enquiries", l: "My Enquiries", i: FileText },
    { k: "quotations", l: "My Quotations", i: ClipboardList },
    { k: "orders", l: "My Orders", i: ShoppingCart },
    { k: "payments", l: "My Payments", i: Wallet },
    { k: "support", l: "Support", i: MessageCircle },
];

export default function CustomerPortal() {
    const [tab, setTab] = useState("profile");
    const [me, setMe] = useState(null);
    const [leads, setLeads] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [orders, setOrders] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const user = await api.auth.me();
                setMe(user);
                const phone = user.phone || user.full_name;
                const [l, q, o, p] = await Promise.all([
                    api.entities.Lead.filter({ phone }, "-created_date", 50).catch(() => []),
                    api.entities.Quotation.list("-created_date", 50).catch(() => []),
                    api.entities.Order.list("-created_date", 50).catch(() => []),
                    api.entities.Payment.list("-created_date", 50).catch(() => []),
                ]);
                setLeads(l);
                setQuotes(q.filter(x => x.customer_name === user.full_name || x.customer_name === user.email));
                setOrders(o.filter(x => x.customer_name === user.full_name || x.customer_name === user.email));
                setPayments(p.filter(x => x.customer_name === user.full_name || x.customer_name === user.email));
            } catch (e) { }
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="py-24 text-center text-ink-soft">Loading your portal...</div>;

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="bg-ink text-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">CUSTOMER PORTAL</span>
                    <h1 className="mt-2 font-heading font-extrabold text-3xl">Welcome, {me?.full_name || "Customer"}</h1>
                    <p className="text-white/60 text-sm mt-1">Manage your enquiries, quotations, orders & payments.</p>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid lg:grid-cols-[220px_1fr] gap-6">
                <aside className="rounded-2xl bg-white border border-black/8 p-3 h-fit lg:sticky lg:top-6">
                    {TABS.map(t => (
                        <button key={t.k} onClick={() => setTab(t.k)} className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${tab === t.k ? "bg-rk-red text-white" : "text-ink-soft hover:bg-muted"}`}>
                            <t.i className="h-4 w-4" /> {t.l}
                        </button>
                    ))}
                </aside>

                <div className="space-y-4">
                    {tab === "profile" && (
                        <div className="rounded-2xl bg-white border border-black/8 p-6">
                            <h2 className="font-heading font-bold text-lg mb-4">My Profile</h2>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                <Info k="Name" v={me?.full_name} />
                                <Info k="Email" v={me?.email} />
                                <Info k="Phone" v={me?.phone || "—"} />
                                <Info k="Role" v={me?.role} />
                            </div>
                        </div>
                    )}

                    {tab === "enquiries" && <List title="My Enquiries" empty="No enquiries yet." items={leads} cols={[["ID", l => l.lead_id], ["Service", l => l.service || "—"], ["Status", l => <span className="text-xs font-bold text-rk-red">{l.status.replace(/_/g, " ")}</span>], ["Date", l => new Date(l.created_date).toLocaleDateString("en-IN")]]} />}

                    {tab === "quotations" && <List title="My Quotations" empty="No quotations yet." items={quotes} cols={[["Quote #", q => q.quotation_number], ["Total", q => formatINR(q.total)], ["Status", q => <span className="text-xs font-bold text-rk-red">{q.status}</span>], ["Valid Till", q => q.valid_until]]} />}

                    {tab === "orders" && (
                        <div className="space-y-3">
                            <h2 className="font-heading font-bold text-lg">My Orders</h2>
                            {orders.length === 0 ? <Empty /> : orders.map(o => (
                                <div key={o.id} className="rounded-2xl bg-white border border-black/8 p-5">
                                    <div className="flex items-center justify-between">
                                        <div><p className="font-mono text-xs text-ink-soft">{o.order_number}</p><p className="font-semibold text-ink mt-0.5">{formatINR(o.total_amount)}</p></div>
                                        <span className="text-xs font-bold rounded-full bg-rk-red/10 text-rk-red px-2.5 py-1">{o.status.replace(/_/g, " ")}</span>
                                    </div>
                                    <div className="mt-4 flex gap-1 flex-wrap">
                                        {ORDER_STATUSES.map((s, i) => { const cur = ORDER_STATUSES.indexOf(o.status); return <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= cur ? "bg-rk-red" : "bg-muted"}`} />; })}
                                    </div>
                                    <div className="mt-3 flex justify-between text-xs text-ink-soft">
                                        <span>Paid: {formatINR(o.paid_amount)}</span>
                                        <span>Pending: {formatINR(o.pending_amount)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === "payments" && <List title="My Payments" empty="No payments yet." items={payments} cols={[["Payment #", p => p.payment_number], ["Amount", p => formatINR(p.amount)], ["Method", p => (p.method || "").replace(/_/g, " ")], ["Date", p => new Date(p.created_date).toLocaleDateString("en-IN")]]} />}

                    {tab === "support" && (
                        <div className="rounded-2xl bg-white border border-black/8 p-6 text-center">
                            <MessageCircle className="h-10 w-10 mx-auto text-rk-red" />
                            <h2 className="mt-3 font-heading font-bold text-lg">Need Help?</h2>
                            <p className="text-sm text-ink-soft mt-1">Reach our team directly on WhatsApp for quick support.</p>
                            <a href={waLink("Hello, I need support regarding my order at RK Printers.")} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rk-red text-white px-5 py-2.5 text-sm font-semibold"><MessageCircle className="h-4 w-4" /> Chat on WhatsApp</a>
                            <p className="mt-3 text-sm text-ink-soft">Or call us: {BRAND.phone1}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Info({ k, v }) { return <div><p className="text-xs text-ink-soft">{k}</p><p className="font-semibold text-ink">{v || "—"}</p></div>; }
function List({ title, items, cols, empty }) {
    return (
        <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
            <div className="p-5 border-b border-black/8"><h2 className="font-heading font-bold text-lg">{title}</h2></div>
            {items.length === 0 ? <p className="p-8 text-center text-sm text-ink-soft">{empty}</p> : (
                <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr>{cols.map((c, i) => <th key={i} className="text-left px-4 py-3 font-semibold">{c[0]}</th>)}</tr></thead>
                    <tbody className="divide-y divide-black/5">{items.map(it => <tr key={it.id} className="hover:bg-muted/30">{cols.map((c, i) => <td key={i} className="px-4 py-3">{c[1](it)}</td>)}</tr>)}</tbody>
                </table></div>
            )}
        </div>
    );
}
function Empty() { return <p className="text-center text-ink-soft py-12">Nothing here yet.</p>; }