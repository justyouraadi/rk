import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { UploadCloud, X, GripVertical, Star, Trash2, Loader2 } from "lucide-react";

/**
 * Multi-image uploader for admin catalogue items.
 * Props:
 *  - images: string[] (public URLs)
 *  - onChange: (urls) => void
 *  - mainImage: string (the primary url, usually images[0])
 *  - altText, onAltTextChange
 *  - onMediaLog: (url) => void  (optional — log to MediaItem)
 *
 * Images are stored publicly — each file gets a permanent public URL that never expires,
 * and anyone with the link can access it (product images must render on the public website).
 */
export default function ImageUploader({ images = [], onChange, altText = "", onAltTextChange, onMediaLog }) {
    const [uploading, setUploading] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);

    const uploadFiles = async (files) => {
        if (!files || !files.length) return;
        setUploading(true);
        try {
            const urls = [];
            for (const f of Array.from(files)) {
                const { file_url } = await api.integrations.Core.UploadPublicFile({ file: f });
                urls.push(file_url);
                onMediaLog?.(file_url, f.name);
            }
            onChange([...images, ...urls]);
        } finally {
            setUploading(false);
        }
    };

    const remove = (i) => onChange(images.filter((_, idx) => idx !== i));
    const setMain = (i) => {
        const copy = [...images];
        const [m] = copy.splice(i, 1);
        copy.unshift(m);
        onChange(copy);
    };
    const move = (from, to) => {
        if (to < 0 || to >= images.length) return;
        const copy = [...images];
        const [m] = copy.splice(from, 1);
        copy.splice(to, 0, m);
        onChange(copy);
    };

    const onDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files;
        if (f && f.length) uploadFiles(f);
    };

    return (
        <div className="space-y-3">
            <label
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/15 bg-muted/30 px-4 py-6 text-center cursor-pointer hover:border-rk-red/50 transition"
            >
                {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-rk-red" />
                ) : (
                    <UploadCloud className="h-6 w-6 text-ink-soft" />
                )}
                <span className="text-sm font-medium text-ink-soft">
                    {uploading ? "Uploading..." : "Drag & drop images or click to upload"}
                </span>
                <span className="text-[11px] text-ink-soft/70">JPG, PNG, WEBP — multiple files allowed</span>
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => uploadFiles(e.target.files)}
                />
            </label>

            {images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {images.map((url, i) => (
                        <div
                            key={url + i}
                            draggable
                            onDragStart={() => setDragIdx(i)}
                            onDragEnd={() => setDragIdx(null)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => { if (dragIdx !== null && dragIdx !== i) move(dragIdx, i); setDragIdx(null); }}
                            className="group relative aspect-square rounded-lg overflow-hidden border border-black/10 bg-muted"
                        >
                            <img src={url} alt={altText || `image ${i + 1}`} className="h-full w-full object-cover" />
                            {i === 0 && (
                                <span className="absolute top-1 left-1 rounded bg-rk-red text-white text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-0.5">
                                    <Star className="h-2.5 w-2.5" /> MAIN
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                                {i !== 0 && (
                                    <button type="button" onClick={() => setMain(i)} title="Set as main" className="grid h-7 w-7 place-items-center rounded bg-white/90 hover:bg-white">
                                        <Star className="h-3.5 w-3.5 text-rk-red" />
                                    </button>
                                )}
                                <button type="button" onClick={() => remove(i)} title="Delete" className="grid h-7 w-7 place-items-center rounded bg-white/90 hover:bg-red-50">
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </button>
                            </div>
                            <span className="absolute bottom-0.5 right-0.5 text-white/70"><GripVertical className="h-3 w-3" /></span>
                        </div>
                    ))}
                </div>
            )}

            <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Image Alt Text</label>
                <input
                    className="rk-input text-sm"
                    placeholder="Describe the image for SEO & accessibility"
                    value={altText}
                    onChange={(e) => onAltTextChange?.(e.target.value)}
                />
            </div>
        </div>
    );
}