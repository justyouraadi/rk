import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Search, Trash2, Copy, X, UploadCloud, Loader2, Filter } from "lucide-react";

const TYPES = ["PRODUCT", "SERVICE", "INDUSTRY", "PORTFOLIO", "BLOG", "OFFER", "OTHER"];

export default function AdminMediaLibrary() {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [fType, setFType] = useState("");
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);

    const load = async () => {
        setLoading(true);
        try { setItems(await api.entities.MediaItem.list("-created_date", 500)); } catch (e) { }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter((m) => (!q || (m.filename + " " + (m.alt_text || "")).toLowerCase().includes(q.toLowerCase())) && (!fType || m.type === fType));

    const upload = async (files) => {
        setUploading(true);
        for (const f of Array.from(files)) {
            try {
                const { file_url } = await api.integrations.Core.UploadPublicFile({ file: f });
                await api.entities.MediaItem.create({ url: file_url, filename: f.name, type: "OTHER", alt_text: "" });
            } catch (e) { }
        }
        setUploading(false); load();
        toast({ title: "Uploaded to media library" });
    };

    const del = async (m) => {
        if (!confirm("Remove from library? (File stays in storage.)")) return;
        try { await api.entities.MediaItem.delete(m.id); toast({ title: "Removed" }); load(); }
        catch (e) { toast({ title: "Failed", variant: "destructive" }); }
    };

    const copyUrl = (url) => { navigator.clipboard.writeText(url); toast({ title: "URL copied" }); };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Media Library</h1><p className="text-sm text-ink-soft">{items.length} media items · central image store</p></div>
                <label className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
                </label>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10" placeholder="Search media..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
                <div className="flex items-center gap-1.5"><Filter className="h-4 w-4 text-ink-soft" />
                    <select className="rk-input max-w-[160px]" value={fType} onChange={(e) => setFType(e.target.value)}><option value="">All Types</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                </div>
            </div>

            {loading ? <p className="p-8 text-center text-ink-soft">Loading…</p> : filtered.length === 0 ? <p className="p-8 text-center text-ink-soft">No media found.</p> : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {filtered.map((m) => (
                        <div key={m.id} className="group relative rounded-xl overflow-hidden border border-black/8 bg-muted aspect-square">
                            <img src={m.url} alt={m.alt_text || m.filename} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5">
                                <button onClick={() => setPreview(m)} className="text-white text-xs font-semibold bg-white/20 rounded px-2 py-1">Preview</button>
                                <button onClick={() => copyUrl(m.url)} className="grid h-7 w-7 place-items-center rounded bg-white/90"><Copy className="h-3.5 w-3.5 text-ink" /></button>
                                <button onClick={() => del(m)} className="grid h-7 w-7 place-items-center rounded bg-white/90"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                            </div>
                            <span className="absolute top-1 left-1 rounded bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5">{m.type}</span>
                        </div>
                    ))}
                </div>
            )}

            {preview && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPreview(null)}>
                    <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setPreview(null)} className="absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90"><X className="h-4 w-4" /></button>
                        <img src={preview.url} alt={preview.alt_text} className="w-full max-h-[70vh] object-contain bg-muted" />
                        <div className="p-4">
                            <p className="font-semibold text-sm">{preview.filename}</p>
                            <p className="text-xs text-ink-soft">{preview.alt_text || "No alt text"}</p>
                            <button onClick={() => copyUrl(preview.url)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rk-red"><Copy className="h-3 w-3" /> Copy URL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}