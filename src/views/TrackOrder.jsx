import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, Package, Loader2 } from "lucide-react";

export default function TrackOrder() {
    const { toast } = useToast();
    const [id, setId] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    const STATUS_FLOW = ["NEW", "DESIGN_PENDING", "DESIGN_IN_PROGRESS", "DESIGN_APPROVAL", "PRINTING", "FINISHING", "QUALITY_CHECK", "PACKING", "READY", "DISPATCHED", "DELIVERED", "COMPLETED"];

    const search = async (e) => {
        e.preventDefault();
        if (!id.trim()) return;
        setLoading(true); setOrder(null);
        try {
            const trimmed = id.trim();
            let found = null;
            try {
                found = await api.entities.Order.get(`track/${encodeURIComponent(trimmed)}`);
            } catch (err) {
                // Ignore and fall back
            }
            if (!found) {
                try {
                    found = await api.entities.Order.get(trimmed);
                } catch (err) {
                    // Ignore
                }
            }
            if (!found) {
                const all = await api.entities.Order.list("-created_date", 200);
                found = all.find((o) => (o.order_number || "").toLowerCase() === trimmed.toLowerCase() || o.id === trimmed);
            }

            if (found) setOrder(found);
            else toast({ title: "Not found", description: "No order with that ID.", variant: "destructive" });
        } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
        finally { setLoading(false); }
    };

    const currentIdx = order ? STATUS_FLOW.indexOf(order.status) : -1;

    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">TRACK</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Track Your Order</h1>
                    <p className="mt-4 text-white/60">Enter your Order ID to see real-time status.</p>
                </div>
            </section>
            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                    <form onSubmit={search} className="flex gap-3 mb-8">
                        <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10" placeholder="Enter Order ID (e.g. RK-ORD-123456)" value={id} onChange={(e) => setId(e.target.value)} /></div>
                        <button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}</button>
                    </form>

                    {order && (
                        <div className="rounded-2xl border border-black/8 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div><p className="text-xs text-ink-soft">Order</p><p className="font-heading font-bold text-lg">{order.order_number}</p></div>
                                <span className="rounded-full bg-rk-red/10 text-rk-red px-3 py-1 text-xs font-bold">{order.status.replace(/_/g, " ")}</span>
                            </div>
                            <p className="text-sm text-ink-soft mb-4">Customer: {order.customer_name}</p>
                            <div className="space-y-3">
                                {STATUS_FLOW.map((s, i) => (
                                    <div key={s} className="flex items-center gap-3">
                                        <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i <= currentIdx ? "bg-rk-red text-white" : "bg-muted text-ink-soft"}`}>{i < currentIdx ? "✓" : i + 1}</div>
                                        <div className={`flex-1 ${i <= currentIdx ? "text-ink" : "text-ink-soft"}`}>{s.replace(/_/g, " ")}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}