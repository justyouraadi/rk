import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Truck, Search, Filter, Edit2, ExternalLink, MessageCircle, CheckCircle2, Clock, MapPin, Package } from "lucide-react";
import { waLink } from "@/lib/brand";

const DELIVERY_STATUSES = [
    { value: "ALL", label: "All Shipments" },
    { value: "READY", label: "Ready for Dispatch" },
    { value: "DISPATCHED", label: "Dispatched / In Transit" },
    { value: "DELIVERED", label: "Delivered" },
];

const COURIER_OPTIONS = ["DTDC", "Delhivery", "Blue Dart", "Trackon", "Professional Courier", "RK Express Van (Local)", "Self Pickup at Kotputli Workshop"];

export default function AdminDelivery() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [saving, setSaving] = useState(false);

    // Dispatch update form
    const [formData, setFormData] = useState({
        order_status: "DISPATCHED",
        courier_name: "DTDC",
        tracking_id: "",
        delivery_date: "",
        notes: "",
    });

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await api.entities.Order.list("-created_date", 200);
            setOrders(data || []);
        } catch (err) {
            console.error("Failed to load orders for delivery:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const openDispatchModal = (order) => {
        setSelectedOrder(order);
        setFormData({
            order_status: order.order_status || order.status || "DISPATCHED",
            courier_name: order.courier_name || "DTDC",
            tracking_id: order.tracking_id || "",
            delivery_date: order.delivery_date || "",
            notes: order.notes || "",
        });
    };

    const handleSaveDispatch = async (e) => {
        e.preventDefault();
        if (!selectedOrder) return;
        setSaving(true);
        try {
            const updated = await api.entities.Order.update(selectedOrder.id, {
                status: formData.order_status,
                order_status: formData.order_status,
                courier_name: formData.courier_name,
                tracking_id: formData.tracking_id,
                delivery_date: formData.delivery_date,
                notes: formData.notes,
            });

            // Update in local state
            setOrders((prev) =>
                prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...updated, ...formData } : o))
            );
            setSelectedOrder(null);
        } catch (err) {
            alert(err.message || "Failed to update delivery details");
        } finally {
            setSaving(false);
        }
    };

    const filteredOrders = orders.filter((o) => {
        const status = o.order_status || o.status || "PLACED";
        if (filterStatus === "READY" && status !== "READY") return false;
        if (filterStatus === "DISPATCHED" && !["DISPATCHED", "IN_TRANSIT"].includes(status)) return false;
        if (filterStatus === "DELIVERED" && status !== "DELIVERED") return false;

        if (search) {
            const q = search.toLowerCase();
            const num = (o.order_number || "").toLowerCase();
            const cust = (o.customer_name || "").toLowerCase();
            const phone = (o.customer_phone || "").toLowerCase();
            const track = (o.tracking_id || "").toLowerCase();
            const courier = (o.courier_name || "").toLowerCase();
            const addr = (o.shipping_address || "").toLowerCase();
            return num.includes(q) || cust.includes(q) || phone.includes(q) || track.includes(q) || courier.includes(q) || addr.includes(q);
        }
        return true;
    });

    const getStatusBadge = (status) => {
        const s = status || "PLACED";
        if (s === "DELIVERED") {
            return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200"><CheckCircle2 className="h-3 w-3" /> Delivered</span>;
        }
        if (s === "DISPATCHED" || s === "IN_TRANSIT") {
            return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200"><Truck className="h-3 w-3" /> Dispatched</span>;
        }
        if (s === "READY") {
            return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Package className="h-3 w-3" /> Ready to Ship</span>;
        }
        return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 border border-gray-200"><Clock className="h-3 w-3" /> {s}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading font-extrabold text-2xl text-ink">Delivery & Logistics</h1>
                    <p className="text-sm text-ink-soft">Track parcel dispatches, courier dockets, and local deliveries.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={loadOrders} className="rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-muted transition">
                        Refresh Shipments
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {DELIVERY_STATUSES.map((st) => (
                        <button
                            key={st.value}
                            onClick={() => setFilterStatus(st.value)}
                            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${filterStatus === st.value ? "bg-rk-red text-white" : "bg-white border border-black/10 text-ink-soft hover:bg-muted"}`}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>
                <div className="relative min-w-[260px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
                    <input
                        type="text"
                        placeholder="Search order, docket, customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-black/10 bg-white pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-rk-red focus:outline-none"
                    />
                </div>
            </div>

            {/* Shipments Table */}
            <div className="rounded-xl border border-black/8 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b border-black/8 text-xs font-bold text-ink-soft uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3.5">Order Number</th>
                                <th className="px-5 py-3.5">Customer / Contact</th>
                                <th className="px-5 py-3.5">Destination Address</th>
                                <th className="px-5 py-3.5">Courier & Docket #</th>
                                <th className="px-5 py-3.5">Expected Delivery</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/6">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-ink-soft">Loading shipments...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-ink-soft">No shipments found matching the criteria.</td>
                                </tr>
                            ) : (
                                filteredOrders.map((o) => (
                                    <tr key={o.id} className="hover:bg-muted/20 transition">
                                        <td className="px-5 py-4 font-mono font-bold text-ink">
                                            {o.order_number || o.id}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-ink">{o.customer_name || "—"}</p>
                                            {o.customer_phone && (
                                                <p className="text-xs text-ink-soft">{o.customer_phone}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 max-w-xs truncate text-ink-soft" title={o.shipping_address || ""}>
                                            <div className="flex items-start gap-1">
                                                <MapPin className="h-3.5 w-3.5 mt-0.5 text-ink-soft/60 shrink-0" />
                                                <span>{o.shipping_address || "Local Pickup / Store Address"}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {o.tracking_id ? (
                                                <div>
                                                    <span className="font-semibold text-xs text-ink block">{o.courier_name || "Courier"}</span>
                                                    <span className="font-mono text-xs text-rk-red font-semibold">{o.tracking_id}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-ink-soft/60 italic">No docket attached</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-ink-soft">
                                            {o.delivery_date ? new Date(o.delivery_date).toLocaleDateString("en-IN") : "Pending"}
                                        </td>
                                        <td className="px-5 py-4">
                                            {getStatusBadge(o.order_status || o.status)}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {o.customer_phone && (
                                                    <a
                                                        href={waLink(`Namaste ${o.customer_name || ""}, update regarding your RK Printers order ${o.order_number}: Status is ${o.order_status || o.status || "In Process"}.${o.tracking_id ? ` Courier: ${o.courier_name}, Docket: ${o.tracking_id}` : ""}`)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-lg border border-black/10 text-emerald-600 hover:bg-emerald-50 transition"
                                                        title="Send WhatsApp Update"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => openDispatchModal(o)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-muted/80 transition"
                                                >
                                                    <Edit2 className="h-3 w-3" /> Update
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dispatch Edit Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-black/10">
                        <div className="flex items-center justify-between pb-4 border-b border-black/8">
                            <div>
                                <h3 className="font-heading font-bold text-lg text-ink">Update Dispatch & Logistics</h3>
                                <p className="text-xs font-mono text-ink-soft">Order: {selectedOrder.order_number}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-ink-soft hover:text-ink text-xl font-bold">&times;</button>
                        </div>

                        <form onSubmit={handleSaveDispatch} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Shipment Status</label>
                                <select
                                    value={formData.order_status}
                                    onChange={(e) => setFormData({ ...formData, order_status: e.target.value })}
                                    className="w-full rounded-lg border border-black/15 p-2 text-sm focus:border-rk-red focus:outline-none"
                                >
                                    <option value="READY">Ready for Dispatch</option>
                                    <option value="DISPATCHED">Dispatched / In Transit</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Courier Partner</label>
                                    <input
                                        type="text"
                                        list="courier-list"
                                        value={formData.courier_name}
                                        onChange={(e) => setFormData({ ...formData, courier_name: e.target.value })}
                                        className="w-full rounded-lg border border-black/15 p-2 text-sm focus:border-rk-red focus:outline-none"
                                        placeholder="e.g. DTDC, Delhivery"
                                    />
                                    <datalist id="courier-list">
                                        {COURIER_OPTIONS.map((c) => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Docket / Tracking ID</label>
                                    <input
                                        type="text"
                                        value={formData.tracking_id}
                                        onChange={(e) => setFormData({ ...formData, tracking_id: e.target.value })}
                                        className="w-full rounded-lg border border-black/15 p-2 text-sm font-mono focus:border-rk-red focus:outline-none"
                                        placeholder="e.g. Z12345678"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Expected Delivery Date</label>
                                <input
                                    type="date"
                                    value={formData.delivery_date}
                                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                                    className="w-full rounded-lg border border-black/15 p-2 text-sm focus:border-rk-red focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Dispatch / Logistics Notes</label>
                                <textarea
                                    rows="2"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full rounded-lg border border-black/15 p-2 text-sm focus:border-rk-red focus:outline-none"
                                    placeholder="e.g. Handed over to DTDC Kotputli hub. Expected 2 days transit."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/8">
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-ink hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-rk-red px-5 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Dispatch Details"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

