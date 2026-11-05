import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, X, Pencil, Trash2, ChevronRight } from "lucide-react";
import { slugify } from "@/lib/catalogue";

const STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"];

export default function AdminCategories() {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [edit, setEdit] = useState(null);
    const [form, setForm] = useState({ name: "", slug: "", parent_id: "", industry_id: "", description: "", status: "ACTIVE", sort_order: 0 });

    const load = async () => {
        setLoading(true);
        try {
            const [cats, inds] = await Promise.all([
                api.entities.Category.list("-created_date", 500),
                api.entities.Industry.list("sort_order", 500),
            ]);
            setItems(cats); setIndustries(inds);
        } catch (e) { }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const indName = (id) => industries.find((i) => i.id === id)?.name || "—";
    const parentName = (id) => items.find((i) => i.id === id)?.name || "—";

    // build a tree: top-level cats, then children grouped by parent
    const topLevel = items.filter((c) => !c.parent_id);
    const childrenOf = (id) => items.filter((c) => c.parent_id === id);
    const matches = (c) => !q || (c.name + " " + (c.description || "")).toLowerCase().includes(q.toLowerCase());

    const openNew = (parentId = "") => { setEdit(null); setForm({ name: "", slug: "", parent_id: parentId, industry_id: "", description: "", status: "ACTIVE", sort_order: 0 }); setShowForm(true); };
    const openEdit = (it) => { setEdit(it); setForm({ ...it }); setShowForm(true); };
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = async () => {
        if (!form.name) { toast({ title: "Name required", variant: "destructive" }); return; }
        const payload = { ...form, slug: form.slug || slugify(form.name), parent_id: form.parent_id || null, industry_id: form.industry_id || null };
        try {
            if (edit) await api.entities.Category.update(edit.id, payload);
            else await api.entities.Category.create(payload);
            toast({ title: edit ? "Category updated" : "Category created" });
            setShowForm(false); load();
        } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    };

    const del = async (it) => {
        if (!confirm(`Delete category "${it.name}"?`)) return;
        try { await api.entities.Category.delete(it.id); toast({ title: "Deleted" }); load(); }
        catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    const renderRow = (c, depth = 0) => {
        if (!matches(c)) return null;
        const kids = childrenOf(c.id);
        return (
            <React.Fragment key={c.id}>
                <tr className="hover:bg-muted/30">
                    <td className="px-4 py-3" style={{ paddingLeft: `${16 + depth * 24}px` }}>
                        <div className="flex items-center gap-2">
                            {depth > 0 && <ChevronRight className="h-3 w-3 text-ink-soft/40" />}
                            <span className="font-semibold text-ink">{c.name}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{indName(c.industry_id)}</td>
                    <td className="px-4 py-3"><span className="text-xs rounded-full bg-muted px-2 py-0.5">{c.status}</span></td>
                    <td className="px-4 py-3 text-right">
                        <button onClick={() => openNew(c.id)} className="text-xs text-rk-red font-semibold hover:underline mr-2">+ Sub</button>
                        <button onClick={() => openEdit(c)} className="grid place-items-center rounded p-1.5 hover:bg-muted inline-block"><Pencil className="h-3.5 w-3.5 text-ink-soft" /></button>
                        <button onClick={() => del(c)} className="grid place-items-center rounded p-1.5 hover:bg-red-50 inline-block"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                    </td>
                </tr>
                {kids.map((k) => renderRow(k, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Categories</h1><p className="text-sm text-ink-soft">Hierarchical: Industry → Category → Sub-category. Unlimited levels.</p></div>
                <button onClick={() => openNew()} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add Category</button>
            </div>

            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10 max-w-sm" placeholder="Search categories..." value={q} onChange={(e) => setQ(e.target.value)} /></div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading…</p> : items.length === 0 ? <p className="p-8 text-center text-ink-soft">No categories yet.</p> : (
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr>
                            <th className="text-left px-4 py-3 font-semibold">Name</th>
                            <th className="text-left px-4 py-3 font-semibold">Industry</th>
                            <th className="text-left px-4 py-3 font-semibold">Status</th>
                            <th className="text-right px-4 py-3 font-semibold">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-black/5">{topLevel.map((c) => renderRow(c))}</tbody>
                    </table></div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between"><h2 className="font-heading font-bold text-lg">{edit ? "Edit" : "Add"} Category</h2><button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button></div>
                        <div className="p-5 space-y-4">
                            <div><label className="block text-sm font-semibold mb-1.5">Name <span className="text-rk-red">*</span></label>
                                <input className="rk-input" value={form.name} onChange={(e) => { set("name", e.target.value); if (!edit) set("slug", slugify(e.target.value)); }} /></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Slug</label>
                                <input className="rk-input" value={form.slug} onChange={(e) => set("slug", e.target.value)} /></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Parent Category (optional)</label>
                                <select className="rk-input" value={form.parent_id || ""} onChange={(e) => set("parent_id", e.target.value)}>
                                    <option value="">— Top Level —</option>
                                    {items.filter((c) => c.id !== edit?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Linked Industry (optional)</label>
                                <select className="rk-input" value={form.industry_id || ""} onChange={(e) => set("industry_id", e.target.value)}>
                                    <option value="">— None —</option>
                                    {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Description</label>
                                <textarea className="rk-input min-h-[70px]" value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
                            <div><label className="block text-sm font-semibold mb-1.5">Status</label>
                                <select className="rk-input" value={form.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                            <button onClick={save} className="w-full rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold">{edit ? "Save Changes" : "Create Category"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}