import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, X, Pencil, Trash2, Loader2, Star, UploadCloud } from "lucide-react";
import { slugify } from "@/lib/catalogue";

const STATUSES = ["ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"];

export default function AdminIndustries() {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [edit, setEdit] = useState(null);
    const [form, setForm] = useState({ name: "", slug: "", description: "", short_description: "", image_url: "", icon: "", accent_color: "", status: "ACTIVE", is_featured: false, sort_order: 0, seo_title: "", seo_description: "", seo_keywords: [] });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [kwInput, setKwInput] = useState("");

    const load = async () => {
        setLoading(true);
        try { setItems(await api.entities.Industry.list("sort_order", 500)); } catch (e) { }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter((i) => !q || (i.name + " " + (i.description || "")).toLowerCase().includes(q.toLowerCase()));

    const openNew = () => { setEdit(null); setForm({ name: "", slug: "", description: "", short_description: "", image_url: "", icon: "", accent_color: "", status: "ACTIVE", is_featured: false, sort_order: 0, seo_title: "", seo_description: "", seo_keywords: [] }); setShowForm(true); };
    const openEdit = (it) => { setEdit(it); setForm({ ...it, seo_keywords: it.seo_keywords || [] }); setShowForm(true); };

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const uploadImg = async (file) => {
        setUploading(true);
        try {
            const { file_url } = await api.integrations.Core.UploadPublicFile({ file });
            set("image_url", file_url);
            await api.entities.MediaItem.create({ url: file_url, filename: file.name, type: "INDUSTRY", alt_text: form.name });
        } catch (e) { toast({ title: "Upload failed", variant: "destructive" }); }
        finally { setUploading(false); }
    };

    const save = async () => {
        if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
        setSaving(true);
        const payload = { ...form, slug: form.slug || slugify(form.name) };
        try {
            if (edit) await api.entities.Industry.update(edit.id, payload);
            else await api.entities.Industry.create(payload);
            toast({ title: edit ? "Industry updated" : "Industry created" });
            setShowForm(false); load();
        } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
        finally { setSaving(false); }
    };

    const del = async (it) => {
        if (!confirm(`Delete industry "${it.name}"? Products assigned to it will keep their data.`)) return;
        try { await api.entities.Industry.delete(it.id); toast({ title: "Deleted" }); load(); }
        catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    const addKw = () => { if (kwInput.trim()) { set("seo_keywords", [...(form.seo_keywords || []), kwInput.trim()]); setKwInput(""); } };
    const rmKw = (i) => set("seo_keywords", (form.seo_keywords || []).filter((_, idx) => idx !== i));

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Industries</h1><p className="text-sm text-ink-soft">Create verticals like Healthcare, Education, Retail — products map to these.</p></div>
                <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add Industry</button>
            </div>

            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10 max-w-sm" placeholder="Search industries..." value={q} onChange={(e) => setQ(e.target.value)} /></div>

            {loading ? <p className="p-8 text-center text-ink-soft">Loading…</p> : filtered.length === 0 ? (
                <div className="rounded-2xl bg-white border border-black/8 p-12 text-center">
                    <p className="text-ink-soft mb-3">No industries yet. Create your first one.</p>
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add Industry</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((it) => (
                        <div key={it.id} className="rounded-2xl bg-white border border-black/8 overflow-hidden hover:shadow-md transition">
                            <div className="aspect-[3/2] bg-muted relative">
                                {it.image_url ? <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-ink-soft/40 text-3xl font-heading font-extrabold">{(it.name || "?").slice(0, 2)}</div>}
                                <div className="absolute top-2 left-2 flex gap-1.5">
                                    <span className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${it.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{it.status}</span>
                                    {it.is_featured && <span className="rounded-full bg-rk-red text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-0.5"><Star className="h-2.5 w-2.5" /> Featured</span>}
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-heading font-bold text-ink">{it.name}</h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(it)} className="grid h-7 w-7 place-items-center rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-ink-soft" /></button>
                                        <button onClick={() => del(it)} className="grid h-7 w-7 place-items-center rounded hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                                    </div>
                                </div>
                                <p className="text-xs text-ink-soft mt-1 line-clamp-2">{it.short_description || it.description || "—"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between">
                            <h2 className="font-heading font-bold text-lg">{edit ? "Edit" : "Add"} Industry</h2>
                            <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div><label className="block text-sm font-semibold mb-1.5">Name <span className="text-rk-red">*</span></label>
                                <input className="rk-input" value={form.name} onChange={(e) => { set("name", e.target.value); if (!edit) set("slug", slugify(e.target.value)); }} placeholder="e.g. Healthcare" /></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Slug</label>
                                <input className="rk-input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated" /></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Short Description</label>
                                <input className="rk-input" value={form.short_description || ""} onChange={(e) => set("short_description", e.target.value)} /></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Description</label>
                                <textarea className="rk-input min-h-[80px]" value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Image</label>
                                {form.image_url ? (
                                    <div className="relative rounded-lg overflow-hidden border border-black/10">
                                        <img src={form.image_url} alt="" className="h-32 w-full object-cover" />
                                        <button onClick={() => set("image_url", "")} className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded bg-white/90"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black/15 py-5 cursor-pointer hover:border-rk-red/40">
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 text-ink-soft" />}
                                        <span className="text-sm text-ink-soft">Upload image</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadImg(e.target.files[0])} />
                                    </label>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-sm font-semibold mb-1.5">Icon (lucide name)</label>
                                    <input className="rk-input" value={form.icon || ""} onChange={(e) => set("icon", e.target.value)} placeholder="e.g. HeartPulse" /></div>
                                <div><label className="block text-sm font-semibold mb-1.5">Accent Color</label>
                                    <input type="color" className="rk-input h-10 p-1" value={form.accent_color || "#E30613"} onChange={(e) => set("accent_color", e.target.value)} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-sm font-semibold mb-1.5">Status</label>
                                    <select className="rk-input" value={form.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                                <div><label className="block text-sm font-semibold mb-1.5">Sort Order</label>
                                    <input type="number" className="rk-input" value={form.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} /></div>
                            </div>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> <span className="text-sm font-medium">Featured industry</span></label>

                            <div className="pt-2 border-t border-black/8">
                                <p className="text-sm font-bold mb-2">SEO</p>
                                <div className="space-y-2">
                                    <input className="rk-input" placeholder="SEO Title" value={form.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} />
                                    <input className="rk-input" placeholder="SEO Description" value={form.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} />
                                    <div className="flex gap-2">
                                        <input className="rk-input" placeholder="Add keyword…" value={kwInput} onChange={(e) => setKwInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKw())} />
                                        <button onClick={addKw} className="px-3 rounded-lg bg-muted text-sm font-semibold">Add</button>
                                    </div>
                                    {(form.seo_keywords || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">{(form.seo_keywords || []).map((k, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">{k}<button onClick={() => rmKw(i)}><X className="h-3 w-3" /></button></span>
                                        ))}</div>
                                    )}
                                </div>
                            </div>

                            <button onClick={save} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold disabled:opacity-50">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{edit ? "Save Changes" : "Create Industry"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}