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
    const [sortBy, setSortBy] = useState("NEWEST");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sel, setSel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLead, setNewLead] = useState({
        name: "", phone: "", whatsapp: "", email: "", business_name: "", service: "", requirement: "", source: "PHONE"
    });

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

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "NEWEST") return new Date(b.created_date || b.createdAt) - new Date(a.created_date || a.createdAt);
        if (sortBy === "OLDEST") return new Date(a.created_date || a.createdAt) - new Date(b.created_date || b.createdAt);
        if (sortBy === "NAME_ASC") return (a.name || "").localeCompare(b.name || "");
        if (sortBy === "STATUS") return (a.status || "").localeCompare(b.status || "");
        return 0;
    });

    const totalPages = Math.ceil(sorted.length / pageSize) || 1;
    const safePage = Math.min(Math.max(1, page), totalPages);
    const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

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

    const handleCreateLead = async (e) => {
        e.preventDefault();
        if (!newLead.name || !newLead.phone) {
            toast({ title: "Name and phone are required", variant: "destructive" });
            return;
        }
        try {
            await api.entities.Lead.create({
                lead_id: genId("LEAD"),
                ...newLead,
                status: "NEW",
            });
            toast({ title: "Lead added successfully" });
            setShowAddModal(false);
            setNewLead({ name: "", phone: "", whatsapp: "", email: "", business_name: "", service: "", requirement: "", source: "PHONE" });
            load();
        } catch (err) {
            toast({ title: "Failed to create lead", description: err.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Leads</h1><p className="text-sm text-ink-soft">{filtered.length} leads</p></div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition self-start sm:self-auto"
                >
                    <Plus className="h-4 w-4" /> Add Lead
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10" placeholder="Search name, phone, requirement..." value={q} onChange={e => setQ(e.target.value)} /></div>
                <select className="rk-input sm:w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="ALL">All Status</option>{LEAD_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
                <select className="rk-input sm:w-44" value={source} onChange={e => { setSource(e.target.value); setPage(1); }}><option value="ALL">All Sources</option>{LEAD_SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</select>
                <select className="rk-input sm:w-44" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
                    <option value="NEWEST">Newest First</option>
                    <option value="OLDEST">Oldest First</option>
                    <option value="NAME_ASC">Name (A–Z)</option>
                    <option value="STATUS">Status</option>
                </select>
            </div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading...</p> : sorted.length === 0 ? <p className="p-8 text-center text-ink-soft">No leads found.</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider">
                                <tr><th className="text-left px-4 py-3 font-semibold">Lead ID</th><th className="text-left px-4 py-3 font-semibold">Name</th><th className="text-left px-4 py-3 font-semibold">Phone</th><th className="text-left px-4 py-3 font-semibold">Service</th><th className="text-left px-4 py-3 font-semibold">Source</th><th className="text-left px-4 py-3 font-semibold">Status</th><th className="text-left px-4 py-3 font-semibold">Date</th></tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {paged.map(l => (
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
                {sorted.length > 0 && (
                    <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-black/8 bg-muted/20 text-xs text-ink-soft">
                        <div className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <select
                                className="rk-input py-1 px-2 text-xs w-16"
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                            <span>Showing {Math.min((safePage - 1) * pageSize + 1, sorted.length)} to {Math.min(safePage * pageSize, sorted.length)} of {sorted.length} leads</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={safePage <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-2.5 py-1 rounded border border-black/10 bg-white font-medium hover:bg-muted disabled:opacity-40"
                            >
                                Prev
                            </button>
                            <span className="font-semibold text-ink">Page {safePage} of {totalPages}</span>
                            <button
                                disabled={safePage >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="px-2.5 py-1 rounded border border-black/10 bg-white font-medium hover:bg-muted disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
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

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-black/10">
                        <div className="flex items-center justify-between pb-3 border-b border-black/8">
                            <h3 className="font-heading font-bold text-lg text-ink">Add New Lead</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-ink-soft hover:text-ink text-xl font-bold">&times;</button>
                        </div>

                        <form onSubmit={handleCreateLead} className="mt-4 space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-ink mb-1">Full Name *</label>
                                    <input
                                        required
                                        className="rk-input"
                                        placeholder="Customer name"
                                        value={newLead.name}
                                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ink mb-1">Phone Number *</label>
                                    <input
                                        required
                                        className="rk-input"
                                        placeholder="10-digit number"
                                        value={newLead.phone}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-ink mb-1">WhatsApp (Optional)</label>
                                    <input
                                        className="rk-input"
                                        placeholder="WhatsApp number"
                                        value={newLead.whatsapp}
                                        onChange={(e) => setNewLead({ ...newLead, whatsapp: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ink mb-1">Email (Optional)</label>
                                    <input
                                        type="email"
                                        className="rk-input"
                                        placeholder="customer@domain.com"
                                        value={newLead.email}
                                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-ink mb-1">Business Name</label>
                                    <input
                                        className="rk-input"
                                        placeholder="Company / shop name"
                                        value={newLead.business_name}
                                        onChange={(e) => setNewLead({ ...newLead, business_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ink mb-1">Lead Source</label>
                                    <select
                                        className="rk-input"
                                        value={newLead.source}
                                        onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                                    >
                                        {LEAD_SOURCES.map((s) => (
                                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-ink mb-1">Service / Product Interested</label>
                                <input
                                    className="rk-input"
                                    placeholder="e.g. Visiting Cards, Packaging Boxes, Flex Banner"
                                    value={newLead.service}
                                    onChange={(e) => setNewLead({ ...newLead, service: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-ink mb-1">Requirement / Notes</label>
                                <textarea
                                    rows="2"
                                    className="rk-input"
                                    placeholder="Quantity, paper type, delivery urgency..."
                                    value={newLead.requirement}
                                    onChange={(e) => setNewLead({ ...newLead, requirement: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/8">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-ink hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-rk-red px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-90"
                                >
                                    Save Lead
                                </button>
                            </div>
                        </form>
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