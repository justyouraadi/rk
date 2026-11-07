import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, Package, Loader2, CheckCircle2, AlertCircle, Clock, Truck, MessageCircle, Calendar } from "lucide-react";
import { waLink } from "@/lib/brand";

const STATUS_STEPS = [
    { key: "PLACED", label: "Order Placed", desc: "Order details received & verified" },
    { key: "DESIGN_IN_PROGRESS", label: "Design & Proofing", desc: "Artwork preparation & proof review" },
    { key: "PRINTING", label: "Printing in Progress", desc: "Production & press run underway" },
    { key: "FINISHING", label: "Finishing & Quality Check", desc: "Cutting, lamination, binding & QC" },
    { key: "DISPATCHED", label: "Dispatched / Out for Delivery", desc: "Handed over to delivery or courier" },
    { key: "DELIVERED", label: "Delivered", desc: "Delivered to customer" },
];

function mapStatusToStep(status = "") {
    const s = String(status).toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") return 5;
    if (s === "DISPATCHED" || s === "SHIPPED" || s === "READY") return 4;
    if (s === "FINISHING" || s === "QUALITY_CHECK" || s === "PACKING") return 3;
    if (s === "PRINTING") return 2;
    if (s === "DESIGN_IN_PROGRESS" || s === "DESIGN_APPROVAL" || s === "DESIGN_PENDING" || s === "IN_PROGRESS") return 1;
    return 0; // PLACED / NEW
}

export default function TrackOrder() {
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    const [id, setId] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchedId, setSearchedId] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const performSearch = async (queryId) => {
        const trimmed = (queryId || id).trim();
        if (!trimmed) return;
        setLoading(true);
        setNotFound(false);
        setErrorMsg("");
        setOrder(null);
        setSearchedId(trimmed);

        try {
            let found = null;
            try {
                const res = await fetch(`http://localhost:3000/api/v1/orders/track/${encodeURIComponent(trimmed)}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) {
                        found = json.data;
                    }
                }
            } catch (netErr) {
                console.warn("Direct track endpoint fetch failed, trying entity fallback:", netErr);
            }

            if (!found) {
                try {
                    found = await api.entities.Order.get(`track/${encodeURIComponent(trimmed)}`);
                } catch { }
            }

            if (!found) {
                try {
                    found = await api.entities.Order.get(trimmed);
                } catch { }
            }

            if (found) {
                setOrder(found);
            } else {
                setNotFound(true);
                toast({
                    title: "Order not found",
                    description: `No order found matching "${trimmed}". Please check the number or WhatsApp us.`,
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error("Tracking error:", err);
            setErrorMsg(err.message || "Failed to search for order. Please try again.");
            toast({
                title: "Error",
                description: err.message || "Unable to reach tracking server.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        performSearch(id);
    };

    // Auto-search if orderId or id is in URL query parameters
    useEffect(() => {
        const urlId = searchParams.get("orderId") || searchParams.get("id") || searchParams.get("order_number");
        if (urlId) {
            setId(urlId);
            performSearch(urlId);
        }
    }, [searchParams]);

    const activeStepIdx = order ? mapStatusToStep(order.status || order.order_status) : 0;

    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red uppercase">TRACKING</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Track Your Order</h1>
                    <p className="mt-4 text-white/60 max-w-xl mx-auto">
                        Enter your Order ID (e.g. <strong>ORD-1793879981163</strong>) to check current printing and dispatch status.
                    </p>
                </div>
            </section>

            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                    <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" />
                            <input
                                className="rk-input pl-10"
                                placeholder="Enter Order ID (e.g. ORD-1793879981163)"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !id.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red px-7 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition shadow-sm"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                            Track Order
                        </button>
                    </form>

                    {errorMsg && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Unable to fetch tracking</p>
                                <p className="text-xs mt-0.5">{errorMsg}</p>
                            </div>
                        </div>
                    )}

                    {notFound && (
                        <div className="rounded-2xl border border-black/10 bg-white p-8 text-center space-y-4 shadow-sm">
                            <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-amber-50 text-amber-600">
                                <AlertCircle className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-xl text-ink">Order Not Found</h3>
                                <p className="text-sm text-ink-soft mt-1.5 max-w-md mx-auto">
                                    We couldn't locate any order matching <strong>"{searchedId}"</strong>.
                                </p>
                            </div>
                            <div className="rounded-xl bg-muted p-4 text-xs text-ink-soft max-w-md mx-auto text-left space-y-1.5">
                                <p className="font-semibold text-ink">Tips for tracking:</p>
                                <p>• Check your WhatsApp invoice message for the exact Order ID (formatted like <code>ORD-17938...</code>).</p>
                                <p>• If you recently placed this order today, it may take 15–30 minutes to appear in the live system.</p>
                            </div>
                            <div className="pt-2">
                                <a
                                    href={waLink(`Hello RK Printers, I am trying to track my order "${searchedId}". Could you please check the status for me?`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
                                >
                                    <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
                                </a>
                            </div>
                        </div>
                    )}

                    {order && (
                        <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-black/8">
                                <div>
                                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Order Number</span>
                                    <h2 className="font-heading font-extrabold text-2xl text-ink mt-0.5">{order.order_number || order.id}</h2>
                                    <p className="text-xs text-ink-soft mt-1">Customer: <strong className="text-ink">{order.customer_name}</strong></p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block rounded-full bg-rk-red/10 border border-rk-red/20 text-rk-red px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                                        {(order.status || order.order_status || "PLACED").replace(/_/g, " ")}
                                    </span>
                                    {order.total_amount && (
                                        <p className="text-sm font-semibold text-ink mt-1.5">Total: ₹{Number(order.total_amount).toLocaleString("en-IN")}</p>
                                    )}
                                </div>
                            </div>

                            {/* Timeline steps */}
                            <div className="space-y-6 pt-2">
                                <h3 className="font-heading font-bold text-base text-ink">Production & Delivery Timeline</h3>
                                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-black/10">
                                    {STATUS_STEPS.map((step, idx) => {
                                        const isCompleted = idx < activeStepIdx;
                                        const isCurrent = idx === activeStepIdx;

                                        return (
                                            <div key={step.key} className="relative flex items-start gap-4">
                                                <div
                                                    className={`absolute -left-6 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ring-4 ring-white transition ${
                                                        isCompleted
                                                            ? "bg-green-600 text-white"
                                                            : isCurrent
                                                            ? "bg-rk-red text-white animate-pulse"
                                                            : "bg-muted text-ink-soft"
                                                    }`}
                                                >
                                                    {isCompleted ? "✓" : idx + 1}
                                                </div>
                                                <div className="pl-2">
                                                    <p className={`font-semibold text-sm ${isCurrent ? "text-rk-red" : isCompleted ? "text-ink" : "text-ink-soft"}`}>
                                                        {step.label}
                                                        {isCurrent && <span className="ml-2 inline-block rounded bg-rk-red/10 text-rk-red text-[10px] font-bold px-2 py-0.5 uppercase">Current Status</span>}
                                                    </p>
                                                    <p className="text-xs text-ink-soft mt-0.5">{step.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Additional info footer */}
                            <div className="pt-6 border-t border-black/8 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-soft">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-rk-red" />
                                    <span>Last updated: {new Date(order.updatedAt || order.updated_date || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <a
                                    href={waLink(`Hello RK Printers, regarding my order ${order.order_number}: could you share an update on the delivery schedule?`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 font-semibold text-rk-red hover:underline"
                                >
                                    <MessageCircle className="h-3.5 w-3.5" /> Need assistance with this order?
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
