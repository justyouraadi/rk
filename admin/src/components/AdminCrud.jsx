import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, X, Trash2, Pencil, Loader2 } from "lucide-react";

/**
 * Generic admin CRUD list+form.
 * config: { entity, title, subtitle, columns:[{key,label,render?}], formFields:[{key,label,type,options?,required?}], defaults }
 */
export default function AdminCrud({ config }) {
    const { entity, title, subtitle, columns, formFields, defaults = {} } = config;
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [edit, setEdit] = useState(null);
    const [form, setForm] = useState(defaults);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => { setLoading(true); try { setItems(await api.entities[entity].list("-created_date", 200)); } catch (e) { } setLoading(false); };
    useEffect(() => { load(); }, []);

    const filtered = items.filter(it => !q || JSON.stringify(it).toLowerCase().includes(q.toLowerCase()));

    const openNew = () => { setEdit(null); setForm(defaults); setShowForm(true); };
    const openEdit = (it) => { setEdit(it); setForm({ ...defaults, ...it }); setShowForm(true); };

    const save = async () => {
        setSaving(true);
        try {
            if (edit) await api.entities[entity].update(edit.id, form);
            else await api.entities[entity].create(form);
            toast({ title: edit ? "Updated" : "Created" });
            setShowForm(false); load();
        } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
        finally { setSaving(false); }
    };

    const del = async (it) => {
        if (!confirm("Delete this record?")) return;
        try { await api.entities[entity].delete(it.id); toast({ title: "Deleted" }); load(); }
        catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">{title}</h1><p className="text-sm text-ink-soft">{subtitle}</p></div>
                <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add New</button>
            </div>

            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10 max-w-sm" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} /></div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-hidden">
                {loading ? <p className="p-8 text-center text-ink-soft">Loading...</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No records found.</p> : (
                    <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr>
                            {columns.map(c => <th key={c.key} className="text-left px-4 py-3 font-semibold">{c.label}</th>)}
                            <th className="text-right px-4 py-3 font-semibold">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-black/5">
                            {filtered.map(it => (
                                <tr key={it.id} className="hover:bg-muted/30">
                                    {columns.map(c => (
                                        <td key={c.key} className="px-4 py-3 text-ink-soft">{c.render ? c.render(it) : (String(it[c.key] ?? "—").slice(0, 60))}</td>
                                    ))}
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => openEdit(it)} className="grid place-items-center rounded p-1.5 hover:bg-muted inline-block"><Pencil className="h-4 w-4 text-ink-soft" /></button>
                                        <button onClick={() => del(it)} className="grid place-items-center rounded p-1.5 hover:bg-red-50 inline-block"><Trash2 className="h-4 w-4 text-red-500" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-black/8 px-5 py-4 flex items-center justify-between"><h2 className="font-heading font-bold text-lg">{edit ? "Edit" : "Add"} {title.slice(0, -1)}</h2><button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button></div>
                        <div className="p-5 space-y-4">
                            {formFields.map(f => (
                                <div key={f.key}>
                                    <label className="block text-sm font-semibold mb-1.5">{f.label}{f.required && <span className="text-rk-red">*</span>}</label>
                                    {f.type === "select" ? (
                                        <select className="rk-input" value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)}>
                                            <option value="">Select...</option>
                                            {f.options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                                        </select>
                                    ) : f.type === "textarea" ? (
                                        <textarea className="rk-input min-h-[100px]" value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)} />
                                    ) : f.type === "boolean" ? (
                                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!form[f.key]} onChange={e => set(f.key, e.target.checked)} /> <span className="text-sm">Yes</span></label>
                                    ) : (
                                        <input type={f.type === "number" ? "number" : "text"} className="rk-input" value={form[f.key] || ""} onChange={e => set(f.key, f.type === "number" ? +e.target.value : e.target.value)} />
                                    )}
                                </div>
                            ))}
                            <button onClick={save} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{edit ? "Save Changes" : "Create"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}