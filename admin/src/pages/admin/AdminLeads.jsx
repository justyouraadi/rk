import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, X, Phone, MessageCircle, Plus, Filter } from "lucide-react";
import { LEAD_STATUSES, LEAD_SOURCES, waLink, genId } from "@/lib/brand";

export default function AdminLeads() {
    const { toast } = useToast();
    const [leads, setLeads] = useState([]);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("ALL");
    const [source, setSource] = useState("ALL");
    const [sel, setSel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState("");

    const load = async () => {
        setLoading(true);
        try { setLeads(await api.entities.Lead.list("-created_date", 200)); } catch (e) { }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = leads.filter(l =>
        (status === "ALL" || l.status === status) &&
        (source === "ALL" || l.source === source) &&
        (!q || (l.name + l.phone + l.requirement).toLowerCase().includes(q.toLowerCase()))
    );

    const updateStatus = async (id, st) => {
        try { await api.entities.Lead.update(id, { status: st }); toast({ title: "Status updated" }); load(); if (sel) setSel({ ...sel, status: st }); }
        catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    };

    const addNote = async () => {
        if (!note.trim() || !sel) return;
        const notes = [...(sel.notes || []), { text: note, created_date: new Date().toISOString() }];
        try { await api.entities.Lead.update(sel.id, { notes }); setSel({ ...sel, notes }); setNote(""); toast({ title: "Note added" }); }
        catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    const convertToCustomer = async (lead) => {
        try {
            const cust = await api.entities.Customer.create({
                customer_id: genId("CUS"), name: lead.name, phone: lead.phone,
                whatsapp: lead.whatsapp, email: lead.email, business_name: lead.business_name, status: "ACTIVE",
            });
            await api.entities.Lead.update(lead.id, { status: "CONVERTED", customer_id: cust.id });
            toast({ title: "Lead converted to customer" });
            load(); setSel(null);
        } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Leads</h1><p className="text-sm text-ink-soft">{filtered.length} leads</p></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10" placeholder="Search name, phone, requirement..." value={q} onChange={e => setQ(e.target.value)} /></div>
                <select className="rk-input sm:w-44" value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">All Status</option>{LEAD_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
                <select className="rk-input sm:w-44" value={source} onChange={e => setSource(e.target.value)}><option value="ALL">All Sources</option>{LEAD_SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
            </div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading...</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No leads found.</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider">
                                <tr><th className="text-left px-4 py-3 font-semibold">Lead ID</th><th className="text-left px-4 py-3 font-semibold">Name</th><th className="text-left px-4 py-3 font-semibold">Phone</th><th className="text-left px-4 py-3 font-semibold">Service</th><th className="text-left px-4 py-3 font-semibold">Source</th><th className="text-left px-4 py-3 font-semibold">Status</th><th className="text-left px-4 py-3 font-semibold">Date</th></tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {filtered.map(l => (
                                    <tr key={l.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSel(l)}>
                                        <td className="px-4 py-3 font-mono text-xs text-ink-soft">{l.lead_id || "—"}</td>
                                        <td className="px-4 py-3 font-semibold text-ink">{l.name}</td>
                                        <td className="px-4 py-3 text-ink-soft">{l.phone}</td>
                                        <td className="px-4 py-3 text-ink-soft">{l.service || "—"}</td>
                                        <td className="px-4 py-3"><span className="text-xs rounded-full bg-muted px-2 py-0.5">{(l.source || "WEBSITE").replace(/_/g, " ")}</span></td>
                                        <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                                        <td className="px-4 py-3 text-xs text-ink-soft">{new Date(l.created_date).toLocaleDateString("en-IN")}</td>
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
                    <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between">
                            <h2 className="font-heading font-bold text-lg">{sel.name}</h2>
                            <button onClick={() => setSel(null)}><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="flex gap-2">
                                <a href={`tel:+${sel.phone}`} className="flex-1 grid place-items-center rounded-lg border border-black/10 py-2.5 text-sm font-semibold hover:bg-muted"><Phone className="h-4 w-4 inline mr-1.5" />Call</a>
                                <a href={waLink(`Hello ${sel.name}, regarding your enquiry at RK Printers.`)} target="_blank" rel="noreferrer" className="flex-1 grid place-items-center rounded-lg border border-black/10 py-2.5 text-sm font-semibold hover:bg-muted"><MessageCircle className="h-4 w-4 inline mr-1.5" />WhatsApp</a>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">Customer Information</p>
                                    <div className="space-y-2">
                                        <Info k="Lead ID" v={sel.lead_id} />
                                        <Info k="Phone" v={sel.phone} />
                                        <Info k="WhatsApp" v={sel.whatsapp} />
                                        <Info k="Email" v={sel.email} />
                                        <Info k="Business" v={sel.business_name} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">Product Configuration</p>
                                    <div className="space-y-2">
                                        {sel.industry && <Info k="Industry" v={sel.industry} />}
                                        {sel.category && <Info k="Category" v={sel.category} />}
                                        <Info k="Product" v={sel.product} />
                                        {sel.variant && <Info k="Variant / Quality" v={sel.variant} />}
                                        {sel.material && <Info k="Material" v={sel.material} />}
                                        {sel.gsm && <Info k="GSM" v={sel.gsm} />}
                                        {sel.size && <Info k="Size" v={sel.size} />}
                                        {sel.finishing && <Info k="Finishing" v={sel.finishing} />}
                                        <Info k="Quantity" v={sel.quantity} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">Enquiry Details</p>
                                    <div className="space-y-2">
                                        <Info k="Source" v={(sel.source || "").replace(/_/g, " ")} />
                                        <Info k="Requirement" v={sel.requirement} />
                                        {sel.delivery_date && <Info k="Delivery Date" v={sel.delivery_date} />}
                                        {sel.additional_requirements && <Info k="Additional Notes" v={sel.additional_requirements} />}
                                        {sel.file_urls?.length > 0 && <Info k="Files" v={`${sel.file_urls.length} file(s)`} />}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-2">Update Status</p>
                                <select className="rk-input" value={sel.status} onChange={e => updateStatus(sel.id, e.target.value)}>{LEAD_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-2">Notes</p>
                                <div className="space-y-2 mb-2">
                                    {(sel.notes || []).map((n, i) => <div key={i} className="rounded-lg bg-muted p-2.5 text-xs"><p>{n.text}</p><p className="text-ink-soft mt-1">{new Date(n.created_date).toLocaleString("en-IN")}</p></div>)}
                                    {(sel.notes || []).length === 0 && <p className="text-xs text-ink-soft">No notes yet.</p>}
                                </div>
                                <div className="flex gap-2"><input className="rk-input" placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)} /><button onClick={addNote} className="grid place-items-center rounded-lg bg-ink text-white px-3"><Plus className="h-4 w-4" /></button></div>
                            </div>
                            <button onClick={() => convertToCustomer(sel)} className="w-full rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold">Convert to Customer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const map = { NEW: "bg-rk-red/10 text-rk-red", CONTACTED: "bg-blue-100 text-blue-700", QUOTE_SENT: "bg-purple-100 text-purple-700", CONVERTED: "bg-green-100 text-green-700", LOST: "bg-gray-100 text-gray-600" };
    return <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${map[status] || "bg-muted text-ink-soft"}`}>{status.replace(/_/g, " ")}</span>;
}
function Info({ k, v }) { return <div className="flex justify-between gap-3"><span className="text-ink-soft shrink-0">{k}</span><span className="font-medium text-ink text-right">{v || "—"}</span></div>; }