import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import {
    User, ShoppingBag, Package, Clock, ShieldCheck, CheckCircle2,
    AlertCircle, LogOut, Phone, Mail, Building, MapPin, ExternalLink,
    ChevronRight, ArrowRight, Loader2, Edit3, Save, FileText
} from "lucide-react";
import { formatINR, ORDER_STATUSES } from "@/lib/brand";

function isOrderApproved(order) {
    if (!order) return false;
    const history = Array.isArray(order.status_history) ? order.status_history : [];
    return history.some((h) => h.status === "APPROVED" || h.status === "DESIGN_APPROVAL" || h.status === "PRINTING");
}

export default function Profile() {
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'profile' | 'enquiries'
    const [leads, setLeads] = useState([]);

    // Profile form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [address, setAddress] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const token = api.auth.getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const currentUser = await api.auth.me();
            if (currentUser) {
                setUser(currentUser);
                setName(currentUser.full_name || currentUser.name || "");
                setPhone(currentUser.phone || "");
                setEmail(currentUser.email || "");
                setCompany(currentUser.company || "");
                setAddress(currentUser.address || "");
            }

            // Fetch user's orders using the dedicated API
            const userOrders = await api.auth.getMyOrders();
            setOrders(userOrders || []);

            // Optionally fetch leads
            if (currentUser?.phone) {
                const userLeads = await api.entities.Lead.filter({ phone: currentUser.phone }, "-created_date", 20).catch(() => []);
                setLeads(userLeads || []);
            }
        } catch (err) {
            console.error("Failed to load profile data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage("");

        try {
            const updated = await api.auth.updateProfile({
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim(),
                company: company.trim(),
                address: address.trim(),
            });

            setUser(updated);
            setSaveMessage("Profile updated successfully!");
            toast({
                title: "Profile Updated",
                description: "Your account information has been saved.",
            });
        } catch (err) {
            console.error("Profile update error:", err);
            setSaveMessage(err.message || "Failed to update profile.");
            toast({
                title: "Update Failed",
                description: err.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        api.auth.logout();
        window.location.href = "/login";
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-rk-red" />
                <p className="text-sm text-ink-soft">Loading your account & orders...</p>
            </div>
        );
    }

    if (!user && !api.auth.getToken()) {
        return (
            <div className="mx-auto max-w-lg py-20 px-4 text-center space-y-5">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-rk-red/10 text-rk-red mx-auto">
                    <User className="h-8 w-8" />
                </div>
                <div>
                    <h2 className="font-heading font-extrabold text-2xl text-ink">Please Sign In</h2>
                    <p className="text-sm text-ink-soft mt-1.5">
                        Log in to view your orders, track printing progress, and manage your account profile.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <a
                        href="/login?returnTo=/profile"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rk-red text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition shadow-sm"
                    >
                        Sign In
                    </a>
                    <a
                        href="/register?returnTo=/profile"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 bg-white text-ink px-6 py-3 text-sm font-semibold hover:bg-muted transition"
                    >
                        Create Account
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 py-10 lg:py-14">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
                {/* Account Header Banner */}
                <div className="rounded-3xl bg-ink text-white p-6 sm:p-8 relative overflow-hidden shadow-xl border border-white/10">
                    <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-rk-red/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rk-red text-white font-heading font-extrabold text-2xl shadow-lg shadow-rk-red/20 shrink-0">
                                {(user?.full_name || user?.name || "C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                                        {user?.full_name || user?.name || "Valued Customer"}
                                    </h1>
                                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5">
                                        Verified Account
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70 mt-1.5">
                                    {user?.phone && (
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-rk-red" /> {user.phone}
                                        </span>
                                    )}
                                    {user?.email && (
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-rk-red" /> {user.email}
                                        </span>
                                    )}
                                    {user?.company && (
                                        <span className="flex items-center gap-1.5">
                                            <Building className="h-3.5 w-3.5 text-rk-red" /> {user.company}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 self-start sm:self-center rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs font-semibold transition border border-white/15"
                        >
                            <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 pt-6 mt-6 border-t border-white/10 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab("orders")}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                activeTab === "orders"
                                    ? "bg-rk-red text-white shadow-md shadow-rk-red/30"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <ShoppingBag className="h-4 w-4" /> My Orders ({orders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                activeTab === "profile"
                                    ? "bg-rk-red text-white shadow-md shadow-rk-red/30"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <Edit3 className="h-4 w-4" /> Profile Settings
                        </button>
                        <button
                            onClick={() => setActiveTab("enquiries")}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                activeTab === "enquiries"
                                    ? "bg-rk-red text-white shadow-md shadow-rk-red/30"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <FileText className="h-4 w-4" /> Enquiries & Quotes ({leads.length})
                        </button>
                    </div>
                </div>

                {/* Tab 1: Orders Section */}
                {activeTab === "orders" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-heading font-extrabold text-xl text-ink">My Orders</h2>
                            <span className="text-xs text-ink-soft">{orders.length} orders on record</span>
                        </div>

                        {orders.length === 0 ? (
                            <div className="rounded-2xl bg-white border border-black/8 p-12 text-center space-y-4 shadow-sm">
                                <Package className="h-12 w-12 text-ink-soft/40 mx-auto" />
                                <div>
                                    <h3 className="font-heading font-bold text-lg text-ink">No Orders Yet</h3>
                                    <p className="text-xs text-ink-soft mt-1 max-w-sm mx-auto">
                                        You haven't placed any orders yet. Browse our print catalog to configure and order your custom prints.
                                    </p>
                                </div>
                                <a
                                    href="/products"
                                    className="inline-flex items-center gap-2 rounded-xl bg-rk-red text-white px-5 py-2.5 text-xs font-semibold hover:opacity-90 transition shadow-sm"
                                >
                                    Browse Products <ArrowRight className="h-4 w-4" />
                                </a>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {orders.map((o) => {
                                    const approved = isOrderApproved(o);
                                    return (
                                        <div
                                            key={o.id}
                                            className="rounded-2xl bg-white border border-black/8 p-5 sm:p-6 shadow-sm hover:shadow-md transition space-y-4"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/6">
                                                <div>
                                                    <span className="font-mono text-xs text-ink-soft font-semibold">ORDER ID</span>
                                                    <p className="font-heading font-extrabold text-lg text-ink">{o.order_number}</p>
                                                    <p className="text-[11px] text-ink-soft">
                                                        Placed on {new Date(o.createdAt || o.created_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                </div>

                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {!approved ? (
                                                            <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" /> Awaiting Approval
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                                <ShieldCheck className="h-3 w-3" /> Approved for Production
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] font-bold rounded-full px-2.5 py-0.5 bg-rk-red/10 text-rk-red">
                                                            {(o.status || o.order_status || "PLACED").replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-extrabold text-ink mt-0.5">
                                                        Total: {formatINR(o.total_amount)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Items */}
                                            {Array.isArray(o.items) && o.items.length > 0 && (
                                                <div className="rounded-xl bg-muted/20 border border-black/5 p-3 space-y-2">
                                                    <p className="text-[11px] font-bold text-ink uppercase tracking-wider">Ordered Items</p>
                                                    {o.items.map((it, idx) => (
                                                        <div key={idx} className="flex justify-between items-start text-xs">
                                                            <div>
                                                                <p className="font-semibold text-ink">{it.name || it.description || "Custom Print Job"}</p>
                                                                {it.specifications && (
                                                                    <p className="text-ink-soft text-[11px]">{it.specifications}</p>
                                                                )}
                                                                <p className="text-ink-soft text-[11px]">Qty: {it.quantity}</p>
                                                            </div>
                                                            <p className="font-bold text-ink">{formatINR(it.amount || 0)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Shipping Address */}
                                            {o.shipping_address && (
                                                <div className="text-xs text-ink-soft flex items-start gap-1.5 pt-1">
                                                    <MapPin className="h-3.5 w-3.5 text-rk-red shrink-0 mt-0.5" />
                                                    <span>Ship to: <strong className="text-ink font-medium">{o.shipping_address}</strong></span>
                                                </div>
                                            )}

                                            {/* Action bar */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/6">
                                                <div className="text-xs">
                                                    <span className="text-ink-soft">Payment: </span>
                                                    <strong className={o.payment_status === "PAID" ? "text-emerald-700" : "text-amber-700"}>
                                                        {o.payment_status || "PENDING"} ({formatINR(o.paid_amount || o.total_amount)})
                                                    </strong>
                                                </div>

                                                <a
                                                    href={`/track-order?orderId=${o.order_number}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition shadow-sm"
                                                >
                                                    <Package className="h-3.5 w-3.5" /> Track Live Status <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Profile Settings */}
                {activeTab === "profile" && (
                    <div className="rounded-2xl bg-white border border-black/8 p-6 sm:p-8 shadow-sm space-y-6">
                        <div>
                            <h2 className="font-heading font-extrabold text-xl text-ink">Account Profile Settings</h2>
                            <p className="text-xs text-ink-soft mt-1">
                                Update your contact info, business name, and default delivery address.
                            </p>
                        </div>

                        {saveMessage && (
                            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                saveMessage.includes("success")
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-red-50 text-red-800 border border-red-200"
                            }`}>
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {saveMessage}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                            <div>
                                <label className="block text-xs font-semibold text-ink mb-1">
                                    Full Name <span className="text-rk-red">*</span>
                                </label>
                                <input
                                    className="rk-input text-sm"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-ink mb-1">
                                        Mobile Number <span className="text-rk-red">*</span>
                                    </label>
                                    <input
                                        className="rk-input text-sm"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-ink mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        className="rk-input text-sm"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink mb-1">
                                    Company / Business Name (Optional)
                                </label>
                                <input
                                    className="rk-input text-sm"
                                    placeholder="Your organization or shop name"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-ink mb-1">
                                    Default Delivery Address
                                </label>
                                <textarea
                                    className="rk-input text-sm resize-none"
                                    rows={3}
                                    placeholder="Shop / office / residential address, pincode"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-rk-red text-white px-6 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-sm"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? "Saving Changes..." : "Save Profile"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab 3: Enquiries Section */}
                {activeTab === "enquiries" && (
                    <div className="rounded-2xl bg-white border border-black/8 p-6 shadow-sm space-y-4">
                        <div>
                            <h2 className="font-heading font-extrabold text-xl text-ink">My Enquiries & Custom Requests</h2>
                            <p className="text-xs text-ink-soft mt-1">Quotes and enquiries submitted from the website</p>
                        </div>

                        {leads.length === 0 ? (
                            <p className="text-center py-8 text-xs text-ink-soft">No enquiries logged yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 text-ink-soft uppercase">
                                        <tr>
                                            <th className="p-3 text-left">Enquiry ID</th>
                                            <th className="p-3 text-left">Requirement</th>
                                            <th className="p-3 text-left">Quantity</th>
                                            <th className="p-3 text-left">Status</th>
                                            <th className="p-3 text-left">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {leads.map((l) => (
                                            <tr key={l.id} className="hover:bg-muted/20">
                                                <td className="p-3 font-mono font-semibold">{l.lead_id || l.id}</td>
                                                <td className="p-3">{l.service || l.product || l.requirement || "Print Job"}</td>
                                                <td className="p-3">{l.quantity || "—"}</td>
                                                <td className="p-3 font-bold text-rk-red">{l.status}</td>
                                                <td className="p-3 text-ink-soft">{new Date(l.createdAt || l.created_date).toLocaleDateString("en-IN")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
