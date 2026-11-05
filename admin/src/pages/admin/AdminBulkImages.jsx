import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Loader2, Search, Link2, Check, X, Image as ImageIcon } from "lucide-react";

/**
 * Bulk image upload with two modes:
 *  A) Auto-match by SKU/Slug parsed from filename (e.g. RK-PROD-0001-1.jpg)
 *  B) Manual mapping — pick a product, upload its images
 *
 * Product images are stored publicly — each file gets a permanent public URL
 * that never expires, and anyone with the link can access it (they render on the public website).
 */
export default function AdminBulkImages() {
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [mode, setMode] = useState("AUTO");
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [manualProduct, setManualProduct] = useState("");
    const [manualFiles, setManualFiles] = useState([]);
    const [q, setQ] = useState("");

    useEffect(() => { api.entities.Product.list("-updated_date", 2000).then(setProducts).catch(() => { }); }, []);

    const matchByFilename = (filename) => {
        const base = filename.replace(/\.[^.]+$/, "");
        const m = base.match(/^(RK-PROD-\d+|[A-Za-z0-9-]+)/i);
        if (!m) return null;
        const token = m[1].toLowerCase();
        return products.find((p) => (p.sku && p.sku.toLowerCase() === token) || (p.slug && p.slug.toLowerCase() === token));
    };

    const onAutoFiles = (fileList) => {
        const arr = Array.from(fileList).map((f) => ({ file: f, matched: matchByFilename(f.name) || null, url: null }));
        setFiles((prev) => [...prev, ...arr]);
    };

    const runAutoUpload = async () => {
        setUploading(true); setProgress(0);
        const updates = {};
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            if (!f.matched) { setProgress(i + 1); continue; }
            try {
                const { file_url } = await api.integrations.Core.UploadPublicFile({ file: f.file });
                await api.entities.MediaItem.create({ url: file_url, filename: f.file.name, type: "PRODUCT", linked_id: f.matched.id, alt_text: f.matched.name });
                const pid = f.matched.id;
                updates[pid] = [...(updates[pid] || f.matched.gallery || []), file_url];
            } catch (e) { }
            setProgress(i + 1);
        }
        // persist gallery updates
        for (const pid of Object.keys(updates)) {
            try { await api.entities.Product.update(pid, { gallery: updates[pid], image_url: updates[pid][0] }); } catch (e) { }
        }
        setUploading(false);
        const matched = files.filter((f) => f.matched).length;
        toast({ title: `Uploaded ${matched} of ${files.length} images` });
        setFiles([]);
    };

    const runManualUpload = async () => {
        if (!manualProduct || !manualFiles.length) { toast({ title: "Select a product and images", variant: "destructive" }); return; }
        setUploading(true);
        try {
            const p = products.find((x) => x.id === manualProduct);
            const urls = [];
            for (const f of manualFiles) {
                const { file_url } = await api.integrations.Core.UploadPublicFile({ file: f });
                await api.entities.MediaItem.create({ url: file_url, filename: f.name, type: "PRODUCT", linked_id: manualProduct, alt_text: p?.name });
                urls.push(file_url);
            }
            const gallery = [...(p?.gallery || []), ...urls];
            await api.entities.Product.update(manualProduct, { gallery, image_url: gallery[0] });
            toast({ title: `${urls.length} images added to ${p?.name}` });
            setManualFiles([]); setManualProduct("");
        } catch (e) { toast({ title: "Upload failed", variant: "destructive" }); }
        finally { setUploading(false); }
    };

    const filteredProducts = products.filter((p) => !q || (p.name + " " + (p.sku || "")).toLowerCase().includes(q.toLowerCase()));

    return (
        <div className="space-y-5">
            <div><h1 className="font-heading font-extrabold text-2xl text-ink">Bulk Image Upload</h1><p className="text-sm text-ink-soft">Upload many product images at once and auto-associate them by filename.</p></div>

            <div className="flex gap-2">
                <button onClick={() => setMode("AUTO")} className={`rounded-lg px-4 py-2 text-sm font-semibold border ${mode === "AUTO" ? "border-rk-red bg-rk-red/5 text-rk-red" : "border-black/10"}`}>A) Auto-match by SKU/Slug</button>
                <button onClick={() => setMode("MANUAL")} className={`rounded-lg px-4 py-2 text-sm font-semibold border ${mode === "MANUAL" ? "border-rk-red bg-rk-red/5 text-rk-red" : "border-black/10"}`}>B) Manual Mapping</button>
            </div>

            {mode === "AUTO" ? (
                <div className="space-y-4">
                    <div className="rounded-lg bg-muted/40 p-3 text-sm text-ink-soft">
                        <p className="font-semibold text-ink mb-1">Filename convention</p>
                        Name files as <span className="font-mono bg-white rounded px-1">SKU-1.jpg</span>, <span className="font-mono bg-white rounded px-1">SKU-2.jpg</span> or <span className="font-mono bg-white rounded px-1">slug-1.jpg</span>. Example: <span className="font-mono">RK-PROD-0001-1.jpg</span> → attaches to product RK-PROD-0001.
                    </div>
                    <label onDrop={(e) => { e.preventDefault(); onAutoFiles(e.dataTransfer.files); }} onDragOver={(e) => e.preventDefault()} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-white py-10 cursor-pointer hover:border-rk-red/40">
                        <UploadCloud className="h-7 w-7 text-ink-soft" /><span className="text-sm font-medium">Drag & drop images (JPG, PNG, WEBP)</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onAutoFiles(e.target.files)} />
                    </label>
                    {files.length > 0 && (
                        <div className="rounded-2xl bg-white border border-black/8 divide-y divide-black/5">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                                    <ImageIcon className="h-4 w-4 text-ink-soft" />
                                    <span className="text-sm font-mono flex-1 truncate">{f.file.name}</span>
                                    {f.matched ? <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold"><Check className="h-3.5 w-3.5" /> {f.matched.name}</span> : <span className="inline-flex items-center gap-1 text-xs text-red-500 font-semibold"><X className="h-3.5 w-3.5" /> No match</span>}
                                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-ink-soft hover:text-red-500"><X className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    {uploading && <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-rk-red transition-all" style={{ width: `${(progress / files.length) * 100}%` }} /></div>}
                    {files.length > 0 && <button onClick={runAutoUpload} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-rk-red text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload & Match</button>}
                </div>
            ) : (
                <div className="space-y-4 max-w-xl">
                    <div><label className="block text-sm font-semibold mb-1.5">Search & select product</label>
                        <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft pointer-events-none" /><input className="rk-input pl-10" placeholder="Search by name or SKU..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
                        <select className="rk-input mt-2" value={manualProduct} onChange={(e) => setManualProduct(e.target.value)}>
                            <option value="">— Select product —</option>
                            {filteredProducts.slice(0, 200).map((p) => <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</option>)}
                        </select>
                    </div>
                    <label onDrop={(e) => { e.preventDefault(); setManualFiles(Array.from(e.dataTransfer.files)); }} onDragOver={(e) => e.preventDefault()} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-white py-10 cursor-pointer hover:border-rk-red/40">
                        <UploadCloud className="h-7 w-7 text-ink-soft" /><span className="text-sm font-medium">{manualFiles.length ? `${manualFiles.length} files selected` : "Drop images here"}</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setManualFiles(Array.from(e.target.files))} />
                    </label>
                    <button onClick={runManualUpload} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-rk-red text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Attach to Product</button>
                </div>
            )}
        </div>
    );
}