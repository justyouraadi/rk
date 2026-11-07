import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import {
    Search, Plus, X, Pencil, Trash2, Copy, Loader2, Star, Download, UploadCloud,
    CheckSquare, Square, Eye, ImageOff,
} from "lucide-react";
import { formatINR } from "@/lib/brand";
import { slugify, genSKU, checkCompleteness, suggestAltText, exportToExcel, productToExportRow } from "@/lib/catalogue";
import ImageUploader from "@/components/admin/ImageUploader";
import CompletenessBadge from "@/components/admin/CompletenessBadge";

const CATS = ["PRINTING", "BRANDING", "PACKAGING", "PROMOTIONAL"];
const STATUSES = ["ACTIVE", "INACTIVE", "DRAFT", "OUT_OF_STOCK", "COMING_SOON"];
const PRICE_TYPES = ["STARTING_PRICE", "FIXED_PRICE", "PER_UNIT", "CUSTOM_QUOTE"];

const TABS = ["Basic", "Images", "Variants", "Options & Pricing", "Categories", "Industries", "SEO"];

export default function AdminProducts() {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [fStatus, setFStatus] = useState("");
    const [fIndustry, setFIndustry] = useState("");
    const [fComplete, setFComplete] = useState("");
    const [selected, setSelected] = useState(new Set());
    const [showForm, setShowForm] = useState(false);
    const [edit, setEdit] = useState(null);
    const [tab, setTab] = useState("Basic");
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const load = async () => {
        setLoading(true);
        try {
            const [prods, inds, cats] = await Promise.all([
                api.entities.Product.list("-updated_date", 1000),
                api.entities.Industry.list("sort_order", 500),
                api.entities.Category.list("-created_date", 500),
            ]);
            setItems(prods); setIndustries(inds); setCategories(cats);
        } catch (e) { }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const indName = (idOrSlug) => {
        const match = industries.find((i) => i.id === idOrSlug || i.slug === idOrSlug);
        return match ? match.name : idOrSlug;
    };

    const filtered = useMemo(() => items.filter((p) => {
        if (q && !JSON.stringify(p).toLowerCase().includes(q.toLowerCase())) return false;
        if (fStatus && p.status !== fStatus) return false;
        if (fIndustry && !(p.industries || []).includes(fIndustry)) return false;
        if (fComplete === "no_image" && p.image_url) return false;
        if (fComplete === "no_seo" && p.seo_title) return false;
        if (fComplete === "no_industry" && (p.industries || []).length) return false;
        if (fComplete === "incomplete" && checkCompleteness(p).complete) return false;
        return true;
    }), [items, q, fStatus, fIndustry, fComplete]);

    const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
    const toggleAll = () => {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(filtered.map((p) => p.id)));
    };
    const toggleOne = (id) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };

    const openNew = () => {
        setEdit(null);
        setForm({ name: "", slug: "", sku: genSKU(items), category: "PRINTING", status: "ACTIVE", is_featured: false, moq: 100, starting_price: 0, custom_pricing: true, price_type: "STARTING_PRICE", industries: [], category_ids: [], materials: [], sizes: [], finishings: [], variants: [], options: [], quantity_options: [], key_benefits: [], use_cases: [], production_time: "", printing_type: "", price_tiers: [], gallery: [], image_url: "", alt_text: "", seo_keywords: [] });
        setTab("Basic"); setShowForm(true);
    };
    const openEdit = (p) => {
        setEdit(p);
        setForm({ ...p, industries: p.industries || [], category_ids: p.category_ids || [], materials: p.materials || [], sizes: p.sizes || [], finishings: p.finishings || [], variants: p.variants || [], options: p.options || [], quantity_options: p.quantity_options || [], key_benefits: p.key_benefits || [], use_cases: p.use_cases || [], production_time: p.production_time || "", printing_type: p.printing_type || "", price_tiers: p.price_tiers || [], gallery: p.gallery || [], seo_keywords: p.seo_keywords || [] });
        setTab("Basic"); setShowForm(true);
    };
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const logMedia = async (url, filename) => {
        try { await api.entities.MediaItem.create({ url, filename, type: "PRODUCT", linked_id: edit?.id, alt_text: form.alt_text || form.name }); } catch (e) { }
    };

    const save = async () => {
        if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
        setSaving(true);
        const payload = { ...form, slug: form.slug || slugify(form.name), image_url: form.gallery?.[0] || form.image_url };
        try {
            if (edit) await api.entities.Product.update(edit.id, payload);
            else await api.entities.Product.create(payload);
            toast({ title: edit ? "Product updated" : "Product created" });
            setShowForm(false); load();
        } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
        finally { setSaving(false); }
    };

    const duplicate = async (p) => {
        try {
            const { id, created_date, updated_date, created_by_id, ...rest } = p;
            await api.entities.Product.create({ ...rest, name: `${p.name} (Copy)`, sku: genSKU(items), slug: slugify(`${p.name}-copy`), is_featured: false });
            toast({ title: "Product duplicated" }); load();
        } catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    const del = async (p) => {
        if (!confirm(`Delete "${p.name}"?`)) return;
        try { await api.entities.Product.delete(p.id); toast({ title: "Deleted" }); load(); }
        catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    // Bulk actions
    const bulkUpdate = async (changes) => {
        const ids = [...selected];
        if (!ids.length) return;
        try {
            await api.entities.Product.bulkUpdate(ids.map((id) => ({ id, ...changes })));
            toast({ title: `Updated ${ids.length} products` });
            setSelected(new Set()); setBulkOpen(false); load();
        } catch (e) { toast({ title: "Bulk update failed", variant: "destructive" }); }
    };
    const bulkDelete = async () => {
        if (!confirm(`Delete ${selected.size} products? This cannot be undone.`)) return;
        try {
            await api.entities.Product.deleteMany({ id: { $in: [...selected] } });
            toast({ title: `Deleted ${selected.size} products` });
            setSelected(new Set()); load();
        } catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };
    const bulkExport = () => {
        const rows = (selected.size ? items.filter((p) => selected.has(p.id)) : filtered).map((p) => productToExportRow(p, Object.fromEntries(industries.map((i) => [i.id, i.name]))));
        exportToExcel(rows, "products_export.xlsx");
    };

    const toggleIndustry = (id) => set("industries", (form.industries || []).includes(id) ? (form.industries || []).filter((x) => x !== id) : [...(form.industries || []), id]);
    const toggleArr = (key, val) => set(key, (form[key] || []).includes(val) ? (form[key] || []).filter((x) => x !== val) : [...(form[key] || []), val]);

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const safePage = Math.min(Math.max(1, page), totalPages);
    const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Products</h1><p className="text-sm text-ink-soft">{items.length} products · data-driven catalogue</p></div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={bulkExport} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-muted"><Download className="h-4 w-4" /> Export</button>
                    <Link to="/admin/bulk-import" className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-muted"><UploadCloud className="h-4 w-4" /> Bulk Import</Link>
                    <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add Product</button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10" placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
                <select className="rk-input max-w-[160px]" value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">All Status</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                <select className="rk-input max-w-[160px]" value={fIndustry} onChange={(e) => setFIndustry(e.target.value)}><option value="">All Industries</option>{industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
                <select className="rk-input max-w-[180px]" value={fComplete} onChange={(e) => setFComplete(e.target.value)}>
                    <option value="">All Completeness</option>
                    <option value="no_image">Missing Images</option>
                    <option value="no_seo">Missing SEO</option>
                    <option value="no_industry">Missing Industry</option>
                    <option value="incomplete">Incomplete</option>
                </select>
            </div>

            {/* Bulk bar */}
            {selected.size > 0 && (
                <div className="sticky top-16 z-10 flex items-center gap-2 flex-wrap rounded-xl bg-ink text-white px-4 py-2.5 shadow-lg">
                    <span className="text-sm font-semibold">{selected.size} selected</span>
                    <button onClick={() => setBulkOpen((v) => !v)} className="text-xs font-semibold bg-white/20 rounded px-2 py-1">Bulk Actions ▾</button>
                    {bulkOpen && (
                        <div className="absolute top-full left-4 mt-1 w-52 rounded-xl bg-white text-ink shadow-xl border border-black/10 py-1 z-20">
                            <button onClick={() => bulkUpdate({ status: "ACTIVE" })} className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Activate</button>
                            <button onClick={() => bulkUpdate({ status: "INACTIVE" })} className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Deactivate</button>
                            <button onClick={() => bulkUpdate({ status: "DRAFT" })} className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Set Draft</button>
                            <button onClick={() => bulkUpdate({ is_featured: true })} className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Set Featured</button>
                            <button onClick={() => bulkUpdate({ is_featured: false })} className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Remove Featured</button>
                            <button onClick={bulkExport} className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Export Selected</button>
                            <button onClick={bulkDelete} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete Selected</button>
                        </div>
                    )}
                    <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-white/70 hover:text-white">Clear</button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading…</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No products match.</p> : (
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr>
                            <th className="px-4 py-3 w-10"><button onClick={toggleAll}>{allSelected ? <CheckSquare className="h-4 w-4 text-rk-red" /> : <Square className="h-4 w-4" />}</button></th>
                            <th className="text-left px-2 py-3 font-semibold">Image</th>
                            <th className="text-left px-3 py-3 font-semibold">SKU</th>
                            <th className="text-left px-3 py-3 font-semibold">Name</th>
                            <th className="text-left px-3 py-3 font-semibold">Category</th>
                            <th className="text-left px-3 py-3 font-semibold">Industry</th>
                            <th className="text-left px-3 py-3 font-semibold">Price</th>
                            <th className="text-left px-3 py-3 font-semibold">Status</th>
                            <th className="text-left px-3 py-3 font-semibold">Feat.</th>
                            <th className="text-left px-3 py-3 font-semibold">Complete</th>
                            <th className="text-right px-4 py-3 font-semibold">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-black/5">
                            {paged.map((p) => {
                                const c = checkCompleteness(p);
                                return (
                                    <tr key={p.id} className={`hover:bg-muted/30 ${selected.has(p.id) ? "bg-rk-red/5" : ""}`}>
                                        <td className="px-4 py-3"><button onClick={() => toggleOne(p.id)}>{selected.has(p.id) ? <CheckSquare className="h-4 w-4 text-rk-red" /> : <Square className="h-4 w-4" />}</button></td>
                                        <td className="px-2 py-3">
                                            {p.image_url ? <img src={p.image_url} alt={p.alt_text || p.name} className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted grid place-items-center"><ImageOff className="h-4 w-4 text-ink-soft/40" /></div>}
                                        </td>
                                        <td className="px-3 py-3 text-xs font-mono text-ink-soft">{p.sku || "—"}</td>
                                        <td className="px-3 py-3"><span className="font-semibold text-ink">{p.name}</span></td>
                                        <td className="px-3 py-3"><span className="text-xs rounded-full bg-muted px-2 py-0.5">{(p.category || "").replace(/_/g, " ")}</span></td>
                                        <td className="px-3 py-3 text-xs text-ink-soft">{(p.industries || []).map(indName).join(", ") || "—"}</td>
                                        <td className="px-3 py-3 text-ink-soft">{p.custom_pricing && !p.starting_price ? "Custom" : formatINR(p.starting_price)}</td>
                                        <td className="px-3 py-3"><span className={`text-xs rounded-full px-2 py-0.5 ${p.status === "ACTIVE" ? "bg-green-100 text-green-700" : p.status === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-muted text-ink-soft"}`}>{p.status}</span></td>
                                        <td className="px-3 py-3">{p.is_featured ? <Star className="h-4 w-4 text-rk-red fill-rk-red" /> : "—"}</td>
                                        <td className="px-3 py-3"><CompletenessBadge missing={c.missing} compact /></td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <button onClick={() => openEdit(p)} title="Edit" className="grid place-items-center rounded p-1.5 hover:bg-muted inline-block"><Pencil className="h-4 w-4 text-ink-soft" /></button>
                                            <button onClick={() => duplicate(p)} title="Duplicate" className="grid place-items-center rounded p-1.5 hover:bg-muted inline-block"><Copy className="h-4 w-4 text-ink-soft" /></button>
                                            <button onClick={() => del(p)} title="Delete" className="grid place-items-center rounded p-1.5 hover:bg-red-50 inline-block"><Trash2 className="h-4 w-4 text-red-500" /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table></div>
                )}
                {filtered.length > 0 && (
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
                                <option value={50}>50</option>
                            </select>
                            <span>Showing {Math.min((safePage - 1) * pageSize + 1, filtered.length)} to {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} products</span>
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

            {/* Edit drawer */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between z-10">
                            <h2 className="font-heading font-bold text-lg">{edit ? "Edit" : "Add"} Product</h2>
                            <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
                        </div>
                        <div className="flex border-b border-black/8 px-5 gap-1 overflow-x-auto no-scrollbar">
                            {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab === t ? "border-rk-red text-rk-red" : "border-transparent text-ink-soft hover:text-ink"}`}>{t}</button>)}
                        </div>
                        <div className="p-5 space-y-4 flex-1">
                            {tab === "Basic" && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-sm font-semibold mb-1.5">Name <span className="text-rk-red">*</span></label><input className="rk-input" value={form.name} onChange={(e) => { set("name", e.target.value); if (!edit) set("slug", slugify(e.target.value)); }} /></div>
                                        <div><label className="block text-sm font-semibold mb-1.5">SKU / Product ID</label><input className="rk-input" value={form.sku || ""} onChange={(e) => set("sku", e.target.value)} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-sm font-semibold mb-1.5">Slug</label><input className="rk-input" value={form.slug} onChange={(e) => set("slug", e.target.value)} /></div>
                                        <div><label className="block text-sm font-semibold mb-1.5">Category <span className="text-rk-red">*</span></label><select className="rk-input" value={form.category} onChange={(e) => set("category", e.target.value)}>{CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}</select></div>
                                    </div>
                                    <div><label className="block text-sm font-semibold mb-1.5">Description</label><textarea className="rk-input min-h-[90px]" value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
                                    <div><label className="block text-sm font-semibold mb-1.5">Specifications</label><textarea className="rk-input min-h-[70px]" value={form.specifications || ""} onChange={(e) => set("specifications", e.target.value)} /></div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><label className="block text-sm font-semibold mb-1.5">MOQ</label><input type="number" className="rk-input" value={form.moq ?? ""} onChange={(e) => set("moq", +e.target.value)} /></div>
                                        <div><label className="block text-sm font-semibold mb-1.5">Starting Price (₹)</label><input type="number" className="rk-input" value={form.starting_price ?? ""} onChange={(e) => set("starting_price", +e.target.value)} /></div>
                                        <div><label className="block text-sm font-semibold mb-1.5">Status</label><select className="rk-input" value={form.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                                    </div>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> <span className="text-sm font-medium">Featured product (shows on homepage)</span></label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-sm font-semibold mb-1.5">Production Time</label><input className="rk-input" value={form.production_time || ""} onChange={(e) => set("production_time", e.target.value)} placeholder="e.g. 24-48 hours" /></div>
                                        <div><label className="block text-sm font-semibold mb-1.5">Printing Type</label><input className="rk-input" value={form.printing_type || ""} onChange={(e) => set("printing_type", e.target.value)} placeholder="e.g. Digital, Offset, Screen" /></div>
                                    </div>
                                </>
                            )}
                            {tab === "Images" && (
                                <>
                                    <p className="text-sm text-ink-soft">Upload multiple images, drag to reorder, set the main image (first). Images are stored publicly so they render on the live website.</p>
                                    <ImageUploader images={form.gallery || []} onChange={(g) => set("gallery", g)} altText={form.alt_text || ""} onAltTextChange={(v) => set("alt_text", v)} onMediaLog={logMedia} />
                                    <button onClick={() => set("alt_text", suggestAltText(form.name))} className="text-xs font-semibold text-rk-red hover:underline">Suggest alt text</button>
                                </>
                            )}
                            {tab === "Variants" && (
                                <>
                                    <p className="text-sm text-ink-soft">Add quality/variant options. Each variant can have its own material, GSM, size, finishing, MOQ, price and production time. These appear as selectable options on the product page.</p>
                                    {(form.variants || []).map((v, i) => (
                                        <div key={i} className="rounded-xl border border-black/8 p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold">Variant {i + 1}: {v.name || "(unnamed)"}</span>
                                                <button onClick={() => set("variants", (form.variants || []).filter((_, idx) => idx !== i))} className="text-red-500"><X className="h-4 w-4" /></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input className="rk-input" placeholder="Variant name (e.g. Premium Matte)" value={v.name || ""} onChange={(e) => set("variants", (form.variants || []).map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                                                <input className="rk-input" placeholder="Material (e.g. 300 GSM)" value={v.material || ""} onChange={(e) => set("variants", (form.variants || []).map((x, idx) => idx === i ? { ...x, material: e.target.value } : x))} />
                                                <input className="rk-input" placeholder="GSM" value={v.gsm || ""} onChange={(e) => set("variants", (form.variants || []).map((x, idx) => idx === i ? { ...x, gsm: e.target.value } : x))} />
                                                <input className="rk-input" placeholder="Size" value={v.size || ""} onChange={(e) => set("variants", (form.variants || []).map((x, idx) => idx === i ? { ...x, size: e.target.value } : x))} />
                                                <input className="rk-input" placeholder="Finishing" value={v.finishing || ""} onChange={(e) => set("variants", (form.variants || []).map((x, idx) => idx === i ? { ...x, finishing: e.target.value } : x))} />
                                                <input type="number" className="rk-input" placeholder="MOQ" value={v.moq || ""} onChange={(e) => set("variants", (form.variants || []).map((x, idx) => idx === i ? { ...x, moq: +e.target.value } : x))} />
                                                <input type="number" className="rk-input" placeholder="Price ₹" value={v.price || ""} onChange={(e) => set("variants", (form.variants || []).map((x, idx) => idx === i ? { ...x, price: +e.target.value } : x))} />
                                                <input className="rk-input" placeholder="Production time" value={v.production_time || ""} onChange={(e) => set("variants", (form.variants || []).map((x, idx) => idx === i ? { ...x, production_time: e.target.value } : x))} />
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => set("variants", [...(form.variants || []), { name: "", material: "", gsm: "", size: "", finishing: "", moq: 0, price: 0, production_time: "", status: "ACTIVE" }])} className="text-sm font-semibold text-rk-red">+ Add variant</button>
                                </>
                            )}
                            {tab === "Options & Pricing" && (
                                <>
                                    <div><label className="block text-sm font-semibold mb-1.5">Price Type</label><select className="rk-input max-w-xs" value={form.price_type} onChange={(e) => set("price_type", e.target.value)}>{PRICE_TYPES.map((p) => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}</select></div>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.custom_pricing} onChange={(e) => set("custom_pricing", e.target.checked)} /> <span className="text-sm font-medium">Custom pricing (quote on request)</span></label>
                                    <ArrEditor label="Materials" arr={form.materials} onChange={(v) => set("materials", v)} presets={["Paper", "PVC", "Vinyl", "Flex", "Fabric", "Acrylic", "Cardboard", "Kraft"]} />
                                    <ArrEditor label="Sizes" arr={form.sizes} onChange={(v) => set("sizes", v)} presets={["A4", "A5", "A6", "Custom"]} />
                                    <ArrEditor label="Finishings" arr={form.finishings} onChange={(v) => set("finishings", v)} presets={["Matte", "Glossy", "Lamination", "UV", "Die Cut", "Embossing", "Foiling", "Binding"]} />
                                    <ArrEditor label="Quantity Options" arr={form.quantity_options} onChange={(v) => set("quantity_options", v)} presets={["50", "100", "250", "500", "1000", "5000", "Custom"]} />
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5">Price Tiers</label>
                                        {(form.price_tiers || []).map((t, i) => (
                                            <div key={i} className="flex gap-2 mb-2">
                                                <input className="rk-input flex-1" placeholder="Label (e.g. Per 100)" value={t.label} onChange={(e) => set("price_tiers", (form.price_tiers || []).map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
                                                <input type="number" className="rk-input w-24" placeholder="Qty" value={t.quantity || ""} onChange={(e) => set("price_tiers", (form.price_tiers || []).map((x, idx) => idx === i ? { ...x, quantity: +e.target.value } : x))} />
                                                <input type="number" className="rk-input w-28" placeholder="Price ₹" value={t.price || ""} onChange={(e) => set("price_tiers", (form.price_tiers || []).map((x, idx) => idx === i ? { ...x, price: +e.target.value } : x))} />
                                                <button onClick={() => set("price_tiers", (form.price_tiers || []).filter((_, idx) => idx !== i))} className="text-red-500 px-2"><X className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => set("price_tiers", [...(form.price_tiers || []), { label: "", quantity: 0, price: 0 }])} className="text-sm font-semibold text-rk-red">+ Add tier</button>
                                    </div>
                                </>
                            )}
                            {tab === "Categories" && (
                                <>
                                    <p className="text-sm text-ink-soft">Select master categories for this product. A product can belong to multiple categories (e.g. Banners can be in both "Banners & Flex" and "Large Format Printing").</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {categories.filter((c) => !c.industry_id).map((c) => (
                                            <label key={c.id} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition ${(form.category_ids || []).includes(c.id) ? "border-rk-red bg-rk-red/5" : "border-black/10 hover:bg-muted"}`}>
                                                <input type="checkbox" checked={(form.category_ids || []).includes(c.id)} onChange={() => set("category_ids", (form.category_ids || []).includes(c.id) ? (form.category_ids || []).filter((x) => x !== c.id) : [...(form.category_ids || []), c.id])} />
                                                <span className="text-sm font-medium">{c.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                            {tab === "Industries" && (
                                <>
                                    <p className="text-sm text-ink-soft">A product can belong to multiple industries. Select all that apply.</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {industries.map((ind) => (
                                            <label key={ind.id} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition ${(form.industries || []).includes(ind.id) ? "border-rk-red bg-rk-red/5" : "border-black/10 hover:bg-muted"}`}>
                                                <input type="checkbox" checked={(form.industries || []).includes(ind.id)} onChange={() => toggleIndustry(ind.id)} />
                                                <span className="text-sm font-medium">{ind.name}</span>
                                            </label>
                                        ))}
                                        {industries.length === 0 && <p className="text-sm text-ink-soft col-span-full">No industries yet. <Link to="/admin/industries" className="text-rk-red font-semibold">Create some first</Link>.</p>}
                                    </div>
                                </>
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
                            <button onClick={save} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{edit ? "Save Changes" : "Create Product"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ArrEditor({ label, arr = [], onChange, presets = [] }) {
    const [input, setInput] = useState("");
    const add = (v) => { if (v && !arr.includes(v)) onChange([...arr, v]); setInput(""); };

    return (
        <div>
            <label className="block text-sm font-semibold mb-1.5">{label}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
                {arr.map((v, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">{v}<button onClick={() => onChange(arr.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button></span>)}
            </div>
            <div className="flex gap-2 mb-2">
                <input className="rk-input" placeholder={`Add ${label.toLowerCase()}...`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(input))} />
                <button onClick={() => add(input)} className="px-3 rounded-lg bg-muted text-sm font-semibold">Add</button>
            </div>
            <div className="flex flex-wrap gap-1">
                {presets.filter((p) => !arr.includes(p)).map((p) => <button key={p} onClick={() => add(p)} className="text-xs rounded-full border border-black/10 px-2 py-0.5 hover:bg-muted">+ {p}</button>)}
            </div>
        </div>
    );
}