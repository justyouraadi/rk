import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, X, Pencil, Trash2, Copy, Loader2, Star, Download } from "lucide-react";
import { formatINR } from "@/lib/brand";
import { slugify, exportToExcel } from "@/lib/catalogue";
import ImageUploader from "@/components/admin/ImageUploader";

const CATS = ["PRINTING", "BRANDING", "PACKAGING", "PROMOTIONAL"];
const STATUSES = ["ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"];
const TABS = ["Basic", "Images", "Industries", "SEO"];

export default function AdminServices() {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [edit, setEdit] = useState(null);
    const [tab, setTab] = useState("Basic");
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [svcs, inds] = await Promise.all([
                api.entities.Service.list("-updated_date", 500),
                api.entities.Industry.list("sort_order", 500),
            ]);
            setItems(svcs); setIndustries(inds);
        } catch (e) { }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const indName = (id) => industries.find((i) => i.id === id)?.name || id;
    const filtered = items.filter((s) => !q || JSON.stringify(s).toLowerCase().includes(q.toLowerCase()));

    const openNew = () => { setEdit(null); setForm({ title: "", slug: "", category: "PRINTING", short_description: "", description: "", starting_price: 0, status: "ACTIVE", is_featured: true, sort_order: 0, industries: [], gallery: [], benefits: [], options: [], seo_keywords: [] }); setTab("Basic"); setShowForm(true); };
    const openEdit = (s) => { setEdit(s); setForm({ ...s, industries: s.industries || [], gallery: s.gallery || [], benefits: s.benefits || [], options: s.options || [], seo_keywords: s.seo_keywords || [] }); setTab("Basic"); setShowForm(true); };
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = async () => {
        if (!form.title) { toast({ title: "Title required", variant: "destructive" }); return; }
        setSaving(true);
        const payload = { ...form, slug: form.slug || slugify(form.title), image_url: form.gallery?.[0] || form.image_url };
        try {
            if (edit) await api.entities.Service.update(edit.id, payload);
            else await api.entities.Service.create(payload);
            toast({ title: edit ? "Service updated" : "Service created" });
            setShowForm(false); load();
        } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
        finally { setSaving(false); }
    };

    const duplicate = async (s) => {
        try {
            const { id, created_date, updated_date, created_by_id, ...rest } = s;
            await api.entities.Service.create({ ...rest, title: `${s.title} (Copy)`, slug: slugify(`${s.title}-copy`) });
            toast({ title: "Service duplicated" }); load();
        } catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    const del = async (s) => {
        if (!confirm(`Delete "${s.title}"?`)) return;
        try { await api.entities.Service.delete(s.id); toast({ title: "Deleted" }); load(); }
        catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    const exportAll = () => exportToExcel(items.map((s) => ({ Title: s.title, Category: s.category, Industries: (s.industries || []).map(indName).join("; "), "Starting Price": s.starting_price, Status: s.status, Featured: s.is_featured ? "Yes" : "No", Slug: s.slug, "SEO Title": s.seo_title || "" })), "services_export.xlsx");

    const toggleIndustry = (id) => set("industries", (form.industries || []).includes(id) ? (form.industries || []).filter((x) => x !== id) : [...(form.industries || []), id]);
    const logMedia = async (url, filename) => { try { await api.entities.MediaItem.create({ url, filename, type: "SERVICE", linked_id: edit?.id, alt_text: form.title }); } catch (e) { } };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Services</h1><p className="text-sm text-ink-soft">{items.length} services · data-driven</p></div>
                <div className="flex gap-2">
                    <button onClick={exportAll} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-muted"><Download className="h-4 w-4" /> Export</button>
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add Service</button>
                </div>
            </div>

            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10 max-w-sm" placeholder="Search services..." value={q} onChange={(e) => setQ(e.target.value)} /></div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-x-auto">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading…</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No services found.</p> : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr>
                            <th className="text-left px-4 py-3 font-semibold">Service</th>
                            <th className="text-left px-3 py-3 font-semibold">Category</th>
                            <th className="text-left px-3 py-3 font-semibold">Industries</th>
                            <th className="text-left px-3 py-3 font-semibold">From</th>
                            <th className="text-left px-3 py-3 font-semibold">Status</th>
                            <th className="text-left px-3 py-3 font-semibold">Feat.</th>
                            <th className="text-right px-4 py-3 font-semibold">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-black/5">
                            {filtered.map((s) => (
                                <tr key={s.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3"><div className="flex items-center gap-2">{s.image_url ? <img src={s.image_url} alt="" className="h-9 w-9 rounded object-cover" /> : <div className="h-9 w-9 rounded bg-muted" />}<span className="font-semibold text-ink">{s.title}</span></div></td>
                                    <td className="px-3 py-3"><span className="text-xs rounded-full bg-muted px-2 py-0.5">{(s.category || "").replace(/_/g, " ")}</span></td>
                                    <td className="px-3 py-3 text-xs text-ink-soft">{(s.industries || []).map(indName).join(", ") || "—"}</td>
                                    <td className="px-3 py-3 text-ink-soft">{formatINR(s.starting_price)}</td>
                                    <td className="px-3 py-3"><span className={`text-xs rounded-full px-2 py-0.5 ${s.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-muted text-ink-soft"}`}>{s.status}</span></td>
                                    <td className="px-3 py-3">{s.is_featured ? <Star className="h-4 w-4 text-rk-red fill-rk-red" /> : "—"}</td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <button onClick={() => openEdit(s)} className="grid place-items-center rounded p-1.5 hover:bg-muted inline-block"><Pencil className="h-4 w-4 text-ink-soft" /></button>
                                        <button onClick={() => duplicate(s)} className="grid place-items-center rounded p-1.5 hover:bg-muted inline-block"><Copy className="h-4 w-4 text-ink-soft" /></button>
                                        <button onClick={() => del(s)} className="grid place-items-center rounded p-1.5 hover:bg-red-50 inline-block"><Trash2 className="h-4 w-4 text-red-500" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between z-10"><h2 className="font-heading font-bold text-lg">{edit ? "Edit" : "Add"} Service</h2><button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button></div>
                        <div className="flex border-b border-black/8 px-5 gap-1 overflow-x-auto no-scrollbar">{TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab === t ? "border-rk-red text-rk-red" : "border-transparent text-ink-soft hover:text-ink"}`}>{t}</button>)}</div>
                        <div className="p-5 space-y-4 flex-1">
                            {tab === "Basic" && (
                                <>
                                    <div><label className="block text-sm font-semibold mb-1.5">Title <span className="text-rk-red">*</span></label><input className="rk-input" value={form.title} onChange={(e) => { set("title", e.target.value); if (!edit) set("slug", slugify(e.target.value)); }} /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-sm font-semibold mb-1.5">Slug</label><input className="rk-input" value={form.slug} onChange={(e) => set("slug", e.target.value)} /></div>
                                        <div><label className="block text-sm font-semibold mb-1.5">Category <span className="text-rk-red">*</span></label><select className="rk-input" value={form.category} onChange={(e) => set("category", e.target.value)}>{CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}</select></div>
                                    </div>
                                    <div><label className="block text-sm font-semibold mb-1.5">Short Description <span className="text-rk-red">*</span></label><input className="rk-input" value={form.short_description || ""} onChange={(e) => set("short_description", e.target.value)} /></div>
                                    <div><label className="block text-sm font-semibold mb-1.5">Full Description</label><textarea className="rk-input min-h-[100px]" value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><label className="block text-sm font-semibold mb-1.5">Starting Price (₹)</label><input type="number" className="rk-input" value={form.starting_price ?? ""} onChange={(e) => set("starting_price", +e.target.value)} /></div>
                                        <div><label className="block text-sm font-semibold mb-1.5">Status</label><select className="rk-input" value={form.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                                        <div><label className="block text-sm font-semibold mb-1.5">Sort Order</label><input type="number" className="rk-input" value={form.sort_order ?? 0} onChange={(e) => set("sort_order", +e.target.value)} /></div>
                                    </div>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> <span className="text-sm font-medium">Featured service</span></label>
                                </>
                            )}
                            {tab === "Images" && <ImageUploader images={form.gallery || []} onChange={(g) => set("gallery", g)} altText={form.title} onAltTextChange={(v) => set("seo_description", v)} onMediaLog={logMedia} />}
                            {tab === "Industries" && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {industries.map((ind) => (
                                        <label key={ind.id} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${(form.industries || []).includes(ind.id) ? "border-rk-red bg-rk-red/5" : "border-black/10 hover:bg-muted"}`}>
                                            <input type="checkbox" checked={(form.industries || []).includes(ind.id)} onChange={() => toggleIndustry(ind.id)} /><span className="text-sm font-medium">{ind.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {tab === "SEO" && (
                                <>
                                    <div><label className="block text-sm font-semibold mb-1.5">SEO Title</label><input className="rk-input" value={form.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} /></div>
                                    <div><label className="block text-sm font-semibold mb-1.5">SEO Description</label><textarea className="rk-input min-h-[70px]" value={form.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} /></div>
                                    <div><label className="block text-sm font-semibold mb-1.5">SEO Keywords</label>
                                        <div className="flex flex-wrap gap-1.5 mb-2">{(form.seo_keywords || []).map((k, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">{k}<button onClick={() => set("seo_keywords", (form.seo_keywords || []).filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button></span>)}</div>
                                        <input className="rk-input" placeholder="Type keyword + Enter" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (e.target.value.trim()) { set("seo_keywords", [...(form.seo_keywords || []), e.target.value.trim()]); e.target.value = ""; } } }} />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="sticky bottom-0 bg-white border-t border-black/8 p-4 flex gap-2">
                            <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-black/10 py-2.5 text-sm font-semibold">Cancel</button>
                            <button onClick={save} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{edit ? "Save Changes" : "Create Service"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}