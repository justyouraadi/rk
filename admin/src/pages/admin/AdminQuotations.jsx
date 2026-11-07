import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, X, Plus, Trash2, FileDown, Send, ArrowRight, Printer, CheckCircle, MessageCircle, ShoppingBag } from "lucide-react";
import { formatINR, genId, waLink } from "@/lib/brand";

const QSTATUS = ["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"];

export default function AdminQuotations() {
    const { toast } = useToast();
    const [quotes, setQuotes] = useState([]);
    const [leads, setLeads] = useState([]);
    const [q, setQ] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [converting, setConverting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        lead_id: "",
        customer_name: "",
        customer_phone: "",
        items: [{ description: "", quantity: 1, rate: 0 }],
        discount: 0,
        gst_percent: 18,
        delivery_charges: 0,
        other_charges: 0,
        notes: "",
    });

    const load = async () => {
        setLoading(true);
        try {
            const [qs, ls] = await Promise.all([
                api.entities.Quotation.list("-created_date", 200),
                api.entities.Lead.list("-created_date", 200),
            ]);
            setQuotes(qs || []);
            setLeads(ls || []);
        } catch (e) {
            console.error("Failed to load quotations:", e);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = quotes.filter(
        (qu) =>
            !q ||
            (qu.quotation_number + " " + qu.customer_name).toLowerCase().includes(q.toLowerCase())
    );

    const setItem = (i, k, v) =>
        setForm((f) => {
            const items = [...f.items];
            items[i] = {
                ...items[i],
                [k]: v,
                amount: (k === "quantity" ? v : items[i].quantity) * (k === "rate" ? v : items[i].rate),
            };
            return { ...f, items };
        });

    const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { description: "", quantity: 1, rate: 0 }] }));
    const rmItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }));

    const calc = () => {
        const subtotal = form.items.reduce((s, it) => s + (Number(it.quantity) * Number(it.rate) || 0), 0);
        const afterDiscount = subtotal - (Number(form.discount) || 0);
        const gst = (afterDiscount * (Number(form.gst_percent) || 0)) / 100;
        const total = afterDiscount + gst + (Number(form.delivery_charges) || 0) + (Number(form.other_charges) || 0);
        return { subtotal, gst_amount: gst, total };
    };

    const create = async () => {
        const lead = leads.find((l) => l.id === form.lead_id);
        const customerName = lead ? lead.name : form.customer_name;
        if (!customerName) {
            toast({ title: "Select a lead or enter customer name", variant: "destructive" });
            return;
        }
        const { subtotal, gst_amount, total } = calc();
        try {
            const created = await api.entities.Quotation.create({
                quotation_number: genId("QT"),
                lead_id: lead ? lead.id : null,
                customer_name: customerName,
                customer_phone: lead ? lead.phone : form.customer_phone,
                items: form.items,
                subtotal,
                discount: form.discount,
                gst_percent: form.gst_percent,
                gst_amount,
                delivery_charges: form.delivery_charges,
                other_charges: form.other_charges,
                total,
                total_amount: total,
                status: "DRAFT",
                notes: form.notes,
                valid_until: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
            });
            if (lead) {
                await api.entities.Lead.update(lead.id, { status: "QUOTE_SENT" }).catch(() => {});
            }
            toast({ title: "Quotation created successfully" });
            setShowForm(false);
            load();
            setForm({
                lead_id: "",
                customer_name: "",
                customer_phone: "",
                items: [{ description: "", quantity: 1, rate: 0 }],
                discount: 0,
                gst_percent: 18,
                delivery_charges: 0,
                other_charges: 0,
                notes: "",
            });
        } catch (e) {
            toast({ title: "Failed to create quotation", description: e.message, variant: "destructive" });
        }
    };

    const updateStatus = async (id, st) => {
        try {
            await api.entities.Quotation.update(id, { status: st });
            toast({ title: `Quotation status updated to ${st}` });
            setQuotes((prev) => prev.map((item) => (item.id === id ? { ...item, status: st } : item)));
            if (selectedQuote && selectedQuote.id === id) {
                setSelectedQuote((prev) => ({ ...prev, status: st }));
            }
        } catch (e) {
            toast({ title: "Failed to update status", description: e.message, variant: "destructive" });
        }
    };

    const convertToOrder = async (quote) => {
        setConverting(true);
        try {
            const orderNum = genId("ORD");
            const total = Number(quote.total || quote.total_amount || 0);

            const newOrder = await api.entities.Order.create({
                order_number: orderNum,
                quotation_id: quote.id,
                lead_id: quote.lead_id,
                customer_id: quote.customer_id,
                customer_name: quote.customer_name,
                customer_phone: quote.customer_phone,
                customer_email: quote.customer_email,
                items: quote.items || [],
                total_amount: total,
                total: total,
                paid_amount: 0,
                pending_amount: total,
                order_status: "PLACED",
                status: "PLACED",
                notes: `Converted from Quotation ${quote.quotation_number}. ${quote.notes || ""}`,
            });

            // Mark quotation as ACCEPTED
            await api.entities.Quotation.update(quote.id, { status: "ACCEPTED" });
            updateStatus(quote.id, "ACCEPTED");

            toast({
                title: "Order Created!",
                description: `Successfully converted to Order #${orderNum}`,
            });
            setSelectedQuote(null);
        } catch (err) {
            toast({
                title: "Conversion failed",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setConverting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading font-extrabold text-2xl text-ink">Quotations</h1>
                    <p className="text-sm text-ink-soft">{filtered.length} quotations issued</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition"
                >
                    <Plus className="h-4 w-4" /> New Quote
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" />
                <input
                    className="rk-input pl-10 max-w-sm"
                    placeholder="Search quote # or customer..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden shadow-sm">
                {loading ? (
                    <p className="p-8 text-center text-ink-soft">Loading quotations...</p>
                ) : filtered.length === 0 ? (
                    <p className="p-8 text-center text-ink-soft">No quotations yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider border-b border-black/8">
                                <tr>
                                    <th className="text-left px-5 py-3.5 font-semibold">Quote #</th>
                                    <th className="text-left px-5 py-3.5 font-semibold">Customer</th>
                                    <th className="text-left px-5 py-3.5 font-semibold">Total</th>
                                    <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                                    <th className="text-left px-5 py-3.5 font-semibold">Date</th>
                                    <th className="text-right px-5 py-3.5 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {filtered.map((qu) => (
                                    <tr
                                        key={qu.id}
                                        onClick={() => setSelectedQuote(qu)}
                                        className="hover:bg-muted/30 cursor-pointer transition"
                                    >
                                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-ink">
                                            {qu.quotation_number}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-ink">
                                            {qu.customer_name}
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-ink">
                                            {formatINR(qu.total || qu.total_amount || 0)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${
                                                    qu.status === "ACCEPTED"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : qu.status === "REJECTED"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-muted text-ink-soft"
                                                }`}
                                            >
                                                {qu.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-ink-soft">
                                            {new Date(qu.created_date || qu.createdAt).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setSelectedQuote(qu)}
                                                className="text-xs text-rk-red font-semibold hover:underline"
                                            >
                                                View Details →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quotation Detail Drawer / Modal */}
            {selectedQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-black/10">
                        <div className="flex items-start justify-between pb-4 border-b border-black/8">
                            <div>
                                <span className="font-mono text-xs font-bold text-rk-red tracking-wider">
                                    {selectedQuote.quotation_number}
                                </span>
                                <h2 className="font-heading font-extrabold text-2xl text-ink mt-0.5">
                                    {selectedQuote.customer_name}
                                </h2>
                                <p className="text-xs text-ink-soft mt-0.5">
                                    Date: {new Date(selectedQuote.created_date || selectedQuote.createdAt).toLocaleDateString("en-IN")}
                                    {selectedQuote.valid_until && ` • Valid until: ${selectedQuote.valid_until}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedQuote(null)}
                                className="rounded-lg p-1.5 text-ink-soft hover:bg-muted transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Status Bar */}
                        <div className="my-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40">
                            <span className="text-xs font-bold text-ink uppercase tracking-wider">Status:</span>
                            <div className="flex gap-1.5 flex-wrap">
                                {QSTATUS.map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => updateStatus(selectedQuote.id, st)}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                            selectedQuote.status === st
                                                ? "bg-rk-red text-white"
                                                : "bg-white border border-black/10 text-ink-soft hover:bg-muted"
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mt-4">
                            <h3 className="font-heading font-bold text-sm text-ink mb-2">Quotation Line Items</h3>
                            <div className="rounded-xl border border-black/8 overflow-hidden text-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/60 text-xs font-bold text-ink-soft uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2.5">Item Description</th>
                                            <th className="px-4 py-2.5 text-center">Qty</th>
                                            <th className="px-4 py-2.5 text-right">Rate</th>
                                            <th className="px-4 py-2.5 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {(selectedQuote.items || []).map((it, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2.5 font-medium text-ink">{it.description || "Custom Print Item"}</td>
                                                <td className="px-4 py-2.5 text-center text-ink-soft">{it.quantity}</td>
                                                <td className="px-4 py-2.5 text-right text-ink-soft">{formatINR(it.rate)}</td>
                                                <td className="px-4 py-2.5 text-right font-semibold text-ink">
                                                    {formatINR(it.amount || it.quantity * it.rate)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Financial Totals */}
                        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-black/6 space-y-2 text-sm">
                            <div className="flex justify-between text-ink-soft">
                                <span>Subtotal</span>
                                <span>{formatINR(selectedQuote.subtotal || 0)}</span>
                            </div>
                            {selectedQuote.discount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span>- {formatINR(selectedQuote.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-ink-soft">
                                <span>GST ({selectedQuote.gst_percent || 18}%)</span>
                                <span>{formatINR(selectedQuote.gst_amount || 0)}</span>
                            </div>
                            {selectedQuote.delivery_charges > 0 && (
                                <div className="flex justify-between text-ink-soft">
                                    <span>Delivery Charges</span>
                                    <span>{formatINR(selectedQuote.delivery_charges)}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-black/10 pt-2 font-bold text-base text-ink">
                                <span>Total Payable</span>
                                <span className="font-extrabold text-rk-red text-lg">
                                    {formatINR(selectedQuote.total || selectedQuote.total_amount || 0)}
                                </span>
                            </div>
                        </div>

                        {selectedQuote.notes && (
                            <div className="mt-4 text-xs text-ink-soft bg-muted/20 p-3 rounded-lg">
                                <p className="font-semibold text-ink">Notes / Terms:</p>
                                <p className="mt-1">{selectedQuote.notes}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-6 pt-4 border-t border-black/8 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex gap-2">
                                <a
                                    href={waLink(
                                        `Namaste ${selectedQuote.customer_name},\nHere is your quotation details from RK Printers Kotputli:\nQuote #: ${selectedQuote.quotation_number}\nTotal Amount: ${formatINR(selectedQuote.total || selectedQuote.total_amount)}\n\nPlease let us know if you approve this quote so we can proceed with printing.`
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                                >
                                    <MessageCircle className="h-4 w-4" /> Share on WhatsApp
                                </a>
                                <button
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold text-ink hover:bg-muted transition"
                                >
                                    <Printer className="h-4 w-4" /> Print
                                </button>
                            </div>

                            <button
                                onClick={() => convertToOrder(selectedQuote)}
                                disabled={converting}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-5 py-2.5 text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition"
                            >
                                <ShoppingBag className="h-4 w-4" />
                                {converting ? "Converting..." : "Convert to Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Quote Form Drawer */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between">
                            <h2 className="font-heading font-bold text-lg">New Quotation</h2>
                            <button onClick={() => setShowForm(false)}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Select Lead (Optional)</label>
                                <select
                                    className="rk-input"
                                    value={form.lead_id}
                                    onChange={(e) => {
                                        const lead = leads.find((l) => l.id === e.target.value);
                                        setForm({
                                            ...form,
                                            lead_id: e.target.value,
                                            customer_name: lead ? lead.name : form.customer_name,
                                            customer_phone: lead ? lead.phone : form.customer_phone,
                                        });
                                    }}
                                >
                                    <option value="">Choose an existing lead or enter below...</option>
                                    {leads.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.name} — {l.service || "General"} ({l.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!form.lead_id && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5">Customer Name</label>
                                        <input
                                            className="rk-input"
                                            placeholder="Client name"
                                            value={form.customer_name}
                                            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5">Phone Number</label>
                                        <input
                                            className="rk-input"
                                            placeholder="10-digit phone"
                                            value={form.customer_phone}
                                            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold">Items</label>
                                    <button
                                        onClick={addItem}
                                        className="text-xs font-semibold text-rk-red flex items-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add Item
                                    </button>
                                </div>
                                {form.items.map((it, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                        <input
                                            className="rk-input col-span-6"
                                            placeholder="Description"
                                            value={it.description}
                                            onChange={(e) => setItem(i, "description", e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            className="rk-input col-span-2"
                                            placeholder="Qty"
                                            value={it.quantity}
                                            onChange={(e) => setItem(i, "quantity", +e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            className="rk-input col-span-3"
                                            placeholder="Rate"
                                            value={it.rate}
                                            onChange={(e) => setItem(i, "rate", +e.target.value)}
                                        />
                                        <button
                                            onClick={() => rmItem(i)}
                                            className="col-span-1 grid place-items-center text-ink-soft hover:text-rk-red"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Discount (₹)</label>
                                    <input
                                        type="number"
                                        className="rk-input"
                                        value={form.discount}
                                        onChange={(e) => setForm({ ...form, discount: +e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">GST %</label>
                                    <input
                                        type="number"
                                        className="rk-input"
                                        value={form.gst_percent}
                                        onChange={(e) => setForm({ ...form, gst_percent: +e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Delivery Charges</label>
                                    <input
                                        type="number"
                                        className="rk-input"
                                        value={form.delivery_charges}
                                        onChange={(e) => setForm({ ...form, delivery_charges: +e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5">Other Charges</label>
                                    <input
                                        type="number"
                                        className="rk-input"
                                        value={form.other_charges}
                                        onChange={(e) => setForm({ ...form, other_charges: +e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-ink-soft">Subtotal</span>
                                    <span className="font-semibold">{formatINR(calc().subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-ink-soft">GST ({form.gst_percent}%)</span>
                                    <span className="font-semibold">{formatINR(calc().gst_amount)}</span>
                                </div>
                                <div className="flex justify-between border-t border-black/10 pt-1 mt-1">
                                    <span className="font-bold">Total</span>
                                    <span className="font-extrabold text-rk-red">{formatINR(calc().total)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Notes</label>
                                <textarea
                                    className="rk-input min-h-[80px]"
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Payment terms, dispatch timelines..."
                                />
                            </div>

                            <button
                                onClick={create}
                                className="w-full rounded-lg bg-rk-red text-white py-3 text-sm font-semibold shadow-md hover:opacity-90"
                            >
                                Create Quotation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
