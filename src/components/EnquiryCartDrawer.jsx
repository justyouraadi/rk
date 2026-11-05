import React from "react";
import { Link } from "react-router-dom";
import { X, Trash2, ShoppingCart, ArrowRight, MessageCircle } from "lucide-react";
import { useEnquiry } from "@/lib/EnquiryContext";
import { waLink } from "@/lib/brand";

export default function EnquiryCartDrawer() {
    const { items, open, setOpen, removeItem, clearAll } = useEnquiry();
    if (!open) return null;

    const waMessage = () => {
        const lines = items.map((it, i) => `${i + 1}. ${it.product_name}${it.variant ? ` (${it.variant})` : ""}${it.quantity ? ` × ${it.quantity}` : ""}`);
        return waLink(`Hello RK Printers,\nI would like a quote for:\n${lines.join("\n")}\n\nPlease share quotation.`);
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
                <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-rk-red" />
                        <h2 className="font-heading font-bold text-lg">Enquiry List ({items.length})</h2>
                    </div>
                    <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {items.length === 0 ? (
                        <div className="text-center py-16">
                            <ShoppingCart className="h-12 w-12 text-ink-soft/20 mx-auto mb-3" />
                            <p className="text-ink-soft text-sm">Your enquiry list is empty.</p>
                            <p className="text-xs text-ink-soft/70 mt-1">Add products from any product page.</p>
                        </div>
                    ) : (
                        items.map((it, i) => (
                            <div key={i} className="rounded-xl border border-black/8 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-ink">{it.product_name}</p>
                                        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-ink-soft">
                                            {it.variant && <span className="rounded bg-muted px-1.5 py-0.5">{it.variant}</span>}
                                            {it.material && <span className="rounded bg-muted px-1.5 py-0.5">{it.material}</span>}
                                            {it.size && <span className="rounded bg-muted px-1.5 py-0.5">{it.size}</span>}
                                            {it.finishing && <span className="rounded bg-muted px-1.5 py-0.5">{it.finishing}</span>}
                                            {it.quantity && <span className="rounded bg-rk-red/10 text-rk-red px-1.5 py-0.5 font-semibold">Qty: {it.quantity}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="border-t border-black/8 p-4 space-y-2">
                        <Link to="/get-quote?from_enquiry=1" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white py-3 text-sm font-semibold hover:opacity-90">
                            Request Quote for All <ArrowRight className="h-4 w-4" />
                        </Link>
                        <a href={waMessage()} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-black/15 text-ink py-3 text-sm font-semibold hover:bg-muted">
                            <MessageCircle className="h-4 w-4" /> Send on WhatsApp
                        </a>
                        <button onClick={clearAll} className="w-full text-center text-xs text-ink-soft hover:text-red-500 pt-1">Clear all</button>
                    </div>
                )}
            </div>
        </div>
    );
}