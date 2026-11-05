import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Download, Loader2, History } from "lucide-react";

export default function AdminImportHistory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.entities.ImportJob.list("-created_date", 100)
            .then(setItems).catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-5">
            <div><h1 className="font-heading font-extrabold text-2xl text-ink">Import History</h1><p className="text-sm text-ink-soft">Every bulk import is logged with a downloadable error report.</p></div>

            <div className="rounded-2xl bg-white border border-black/8 overflow-x-auto">
                {loading ? <p className="p-8 text-center text-ink-soft"><Loader2 className="h-5 w-5 animate-spin inline" /> Loading…</p> : items.length === 0 ? (
                    <div className="p-12 text-center"><History className="h-10 w-10 text-ink-soft/30 mx-auto mb-2" /><p className="text-ink-soft">No imports yet. <a href="/admin/bulk-import" className="text-rk-red font-semibold">Run your first import</a>.</p></div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-ink-soft text-xs uppercase tracking-wider"><tr>
                            <th className="text-left px-4 py-3 font-semibold">Date</th>
                            <th className="text-left px-3 py-3 font-semibold">File</th>
                            <th className="text-left px-3 py-3 font-semibold">Type</th>
                            <th className="text-left px-3 py-3 font-semibold">Mode</th>
                            <th className="text-left px-3 py-3 font-semibold">Rows</th>
                            <th className="text-left px-3 py-3 font-semibold text-green-600">Created</th>
                            <th className="text-left px-3 py-3 font-semibold text-blue-600">Updated</th>
                            <th className="text-left px-3 py-3 font-semibold text-amber-600">Skipped</th>
                            <th className="text-left px-3 py-3 font-semibold text-red-500">Errors</th>
                            <th className="text-right px-4 py-3 font-semibold">Report</th>
                        </tr></thead>
                        <tbody className="divide-y divide-black/5">
                            {items.map((j) => (
                                <tr key={j.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 text-xs text-ink-soft">{new Date(j.created_date).toLocaleString("en-IN")}</td>
                                    <td className="px-3 py-3 font-mono text-xs">{j.file_name}</td>
                                    <td className="px-3 py-3"><span className="text-xs rounded-full bg-muted px-2 py-0.5">{j.entity_type}</span></td>
                                    <td className="px-3 py-3 text-xs text-ink-soft">{j.mode}</td>
                                    <td className="px-3 py-3 text-ink-soft">{j.total_rows}</td>
                                    <td className="px-3 py-3 text-green-600 font-semibold">{j.created}</td>
                                    <td className="px-3 py-3 text-blue-600 font-semibold">{j.updated}</td>
                                    <td className="px-3 py-3 text-amber-600">{j.skipped}</td>
                                    <td className="px-3 py-3 text-red-500">{j.errors_count}</td>
                                    <td className="px-4 py-3 text-right">
                                        {j.error_report_url ? <a href={j.error_report_url} download="IMPORT_ERRORS.xlsx" className="inline-flex items-center gap-1 text-xs font-semibold text-rk-red hover:underline"><Download className="h-3.5 w-3.5" /> Errors</a> : <span className="text-xs text-ink-soft/40">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}