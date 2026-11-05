import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Star } from "lucide-react";

export default function AdminReviews() {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => { setLoading(true); try { setItems(await api.entities.Review.list("-created_date", 200)); } catch (e) { } setLoading(false); };
    useEffect(() => { load(); }, []);

    const approve = async (r) => { try { await api.entities.Review.update(r.id, { is_approved: true }); toast({ title: "Approved" }); load(); } catch (e) { toast({ title: "Failed", variant: "destructive" }); } };
    const del = async (r) => { if (!confirm("Delete review?")) return; try { await api.entities.Review.delete(r.id); toast({ title: "Deleted" }); load(); } catch (e) { toast({ title: "Failed", variant: "destructive" }); } };

    return (
        <div className="space-y-5">
            <div><h1 className="font-heading font-extrabold text-2xl text-ink">Reviews</h1><p className="text-sm text-ink-soft">Approve customer reviews before publishing</p></div>
            <div className="grid gap-4">
                {loading ? <p className="text-center text-ink-soft py-12">Loading...</p> : items.length === 0 ? <p className="text-center text-ink-soft py-12">No reviews yet.</p> :
                    items.map(r => (
                        <div key={r.id} className="rounded-2xl bg-white border border-black/8 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-ink">{r.name}</span>
                                        {r.business && <span className="text-xs text-ink-soft">· {r.business}</span>}
                                    </div>
                                    <div className="flex gap-0.5 my-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-rk-red text-rk-red" : "text-black/15"}`} />)}</div>
                                    <p className="text-sm text-ink-soft">{r.review}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${r.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{r.is_approved ? "Published" : "Pending"}</span>
                                    <div className="flex gap-1">
                                        {!r.is_approved && <button onClick={() => approve(r)} className="grid place-items-center rounded p-1.5 bg-green-50 hover:bg-green-100"><Check className="h-4 w-4 text-green-600" /></button>}
                                        <button onClick={() => del(r)} className="grid place-items-center rounded p-1.5 bg-red-50 hover:bg-red-100"><X className="h-4 w-4 text-red-500" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}