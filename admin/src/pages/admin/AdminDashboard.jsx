import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Users, ShoppingCart, ClipboardList, Wallet, TrendingUp, ArrowUpRight, Package } from "lucide-react";
import { formatINR, LEAD_SOURCES } from "@/lib/brand";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const CHART_COLORS = ["hsl(357,85%,52%)", "hsl(187,100%,42%)", "hsl(327,100%,47%)", "hsl(48,100%,50%)", "hsl(0,0%,9%)", "hsl(0,0%,45%)", "hsl(357,80%,65%)", "hsl(187,60%,65%)"];

export default function AdminDashboard() {
    const [data, setData] = useState({ leads: [], orders: [], quotations: [], payments: [], products: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [leads, orders, quotations, payments, products, industries, categories] = await Promise.all([
                    api.entities.Lead.list("-created_date", 200).catch(() => []),
                    api.entities.Order.list("-created_date", 200).catch(() => []),
                    api.entities.Quotation.list("-created_date", 200).catch(() => []),
                    api.entities.Payment.list("-created_date", 200).catch(() => []),
                    api.entities.Product.list("-created_date", 2000).catch(() => []),
                    api.entities.Industry.list("sort_order", 500).catch(() => []),
                    api.entities.Category.list("sort_order", 500).catch(() => []),
                ]);
                setData({ leads, orders, quotations, payments, products, industries, categories });
            } catch (e) { }
            setLoading(false);
        })();
    }, []);

    const today = new Date().toDateString();
    const todayLeads = data.leads.filter(l => new Date(l.created_date).toDateString() === today).length;
    const todayOrders = data.orders.filter(o => new Date(o.created_date).toDateString() === today).length;
    const pendingQuotes = data.quotations.filter(q => ["DRAFT", "SENT", "VIEWED"].includes(q.status)).length;
    const productionOrders = data.orders.filter(o => ["PRINTING", "FINISHING", "QUALITY_CHECK", "DESIGN_IN_PROGRESS"].includes(o.status)).length;
    const pendingPayments = data.orders.reduce((s, o) => s + (o.pending_amount || 0), 0);
    const monthlyRevenue = data.payments.filter(p => p.status === "SUCCESS" && new Date(p.created_date).getMonth() === new Date().getMonth()).reduce((s, p) => s + (p.amount || 0), 0);

    const metrics = [
        { label: "Today's Leads", value: todayLeads, icon: Users, link: "/admin/leads" },
        { label: "Today's Orders", value: todayOrders, icon: ShoppingCart, link: "/admin/orders" },
        { label: "Pending Quotes", value: pendingQuotes, icon: ClipboardList, link: "/admin/quotations" },
        { label: "In Production", value: productionOrders, icon: Package, link: "/admin/orders" },
        { label: "Pending Payments", value: formatINR(pendingPayments), icon: Wallet, link: "/admin/payments" },
        { label: "Monthly Revenue", value: formatINR(monthlyRevenue), icon: TrendingUp, link: "/admin/payments" },
    ];

    const catMetrics = [
        { label: "Industries", value: (data.industries || []).length, link: "/admin/industries" },
        { label: "Master Categories", value: (data.categories || []).filter(c => !c.industry_id).length, link: "/admin/categories" },
        { label: "Total Products", value: (data.products || []).length, link: "/admin/products" },
        { label: "Active", value: (data.products || []).filter(p => p.status === "ACTIVE").length, link: "/admin/products" },
        { label: "With Variants", value: (data.products || []).filter(p => (p.variants || []).length > 0).length, link: "/admin/products" },
        { label: "Without Variants", value: (data.products || []).filter(p => (p.variants || []).length === 0).length, link: "/admin/products" },
        { label: "Without Pricing", value: (data.products || []).filter(p => !p.starting_price && p.price_type !== "CUSTOM_QUOTE").length, link: "/admin/products" },
        { label: "Without Description", value: (data.products || []).filter(p => !p.description).length, link: "/admin/products" },
    ];

    const sourceData = LEAD_SOURCES.map(s => ({ name: s.replace("_", " "), value: data.leads.filter(l => l.source === s).length })).filter(d => d.value > 0);
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d; });
    const salesData = months.map(d => {
        const rev = data.payments.filter(p => p.status === "SUCCESS" && new Date(p.created_date).getMonth() === d.getMonth() && new Date(p.created_date).getFullYear() === d.getFullYear()).reduce((s, p) => s + (p.amount || 0), 0);
        return { name: d.toLocaleString("en-IN", { month: "short" }), revenue: rev };
    });
    const orderStatuses = ["NEW", "DESIGN_PENDING", "PRINTING", "READY", "DISPATCHED", "DELIVERED", "COMPLETED"];
    const statusData = orderStatuses.map(s => ({ name: s.replace(/_/g, " "), value: data.orders.filter(o => o.status === s).length })).filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading font-extrabold text-2xl text-ink">Dashboard</h1>
                <p className="text-sm text-ink-soft">Welcome back — here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {metrics.map((m, i) => (
                    <Link key={i} to={m.link} className="rounded-2xl bg-white border border-black/8 p-5 hover:shadow-md transition group">
                        <div className="flex items-center justify-between">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-rk-red/10 text-rk-red"><m.icon className="h-4 w-4" /></div>
                            <ArrowUpRight className="h-4 w-4 text-ink-soft/40 group-hover:text-rk-red transition" />
                        </div>
                        <p className="mt-3 text-xs text-ink-soft">{m.label}</p>
                        <p className="mt-1 font-heading font-extrabold text-xl text-ink">{m.value}</p>
                    </Link>
                ))}
            </div>

            {/* Catalogue Management */}
            <div className="rounded-2xl bg-white border border-black/8 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold text-sm text-ink">Catalogue Management</h3>
                    <Link to="/admin/catalogue" className="text-xs font-semibold text-rk-red hover:underline">View all →</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {catMetrics.map((m, i) => (
                        <Link key={i} to={m.link} className="rounded-lg bg-muted/50 p-3 hover:bg-muted transition">
                            <p className="text-xs text-ink-soft">{m.label}</p>
                            <p className="mt-1 font-heading font-extrabold text-lg text-ink">{m.value}</p>
                        </Link>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/admin/industries" className="text-xs font-semibold rounded-lg border border-black/10 px-3 py-1.5 hover:bg-muted">+ Add Industry</Link>
                    <Link to="/admin/categories" className="text-xs font-semibold rounded-lg border border-black/10 px-3 py-1.5 hover:bg-muted">+ Add Category</Link>
                    <Link to="/admin/products" className="text-xs font-semibold rounded-lg border border-black/10 px-3 py-1.5 hover:bg-muted">+ Add Product</Link>
                    <Link to="/admin/bulk-import" className="text-xs font-semibold rounded-lg border border-black/10 px-3 py-1.5 hover:bg-muted">Bulk Import</Link>
                </div>
            </div>

            {loading ? <p className="text-center text-ink-soft py-12">Loading dashboard...</p> : (
                <div className="grid lg:grid-cols-2 gap-6">
                    <ChartCard title="Monthly Revenue">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(0,0%,45%)" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: "hsl(0,0%,45%)" }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(0,0%,90%)" }} />
                                <Bar dataKey="revenue" fill="hsl(357,85%,52%)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Lead Sources">
                        {sourceData.length ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                                        {sourceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <Empty />}
                    </ChartCard>

                    <ChartCard title="Order Status Distribution">
                        {statusData.length ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={statusData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(0,0%,45%)" }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "hsl(0,0%,45%)" }} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="hsl(0,0%,9%)" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <Empty />}
                    </ChartCard>

                    <ChartCard title="Recent Leads">
                        <div className="space-y-2">
                            {data.leads.slice(0, 5).map(l => (
                                <Link key={l.id} to="/admin/leads" className="flex items-center justify-between rounded-lg p-2.5 hover:bg-muted transition">
                                    <div><p className="text-sm font-semibold text-ink">{l.name}</p><p className="text-xs text-ink-soft">{l.service || (l.requirement || "").slice(0, 40)}</p></div>
                                    <span className="text-[10px] font-bold text-rk-red">{l.status.replace(/_/g, " ")}</span>
                                </Link>
                            ))}
                            {data.leads.length === 0 && <Empty />}
                        </div>
                    </ChartCard>
                </div>
            )}
        </div>
    );
}

function ChartCard({ title, children }) {
    return <div className="rounded-2xl bg-white border border-black/8 p-5"><h3 className="font-heading font-bold text-sm mb-4 text-ink">{title}</h3>{children}</div>;
}
function Empty() { return <div className="h-[200px] grid place-items-center text-sm text-ink-soft">No data yet</div>; }