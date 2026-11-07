import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import {
    UploadCloud, FileSpreadsheet, Check, X, Loader2, Download, ArrowRight,
    AlertTriangle, CheckCircle2, ArrowLeft, Layers,
} from "lucide-react";
import { parseSpreadsheet, slugify, exportToExcel, buildErrorReport } from "@/lib/catalogue";

const ENTITY_FIELDS = {
    PRODUCT: {
        name: "Product", plural: "Products", key: "sku",
        fields: {
            name: { label: "Product Name", required: true },
            sku: { label: "Product ID / SKU" },
            category: { label: "Category", enum: ["PRINTING", "BRANDING", "PACKAGING", "PROMOTIONAL"] },
            industries: { label: "Industry (multi, ; separated)", multi: true },
            description: { label: "Description" },
            material: { label: "Material" },
            size: { label: "Size" },
            finishing: { label: "Finishing" },
            moq: { label: "MOQ", type: "number" },
            starting_price: { label: "Price", type: "number" },
            price_type: { label: "Price Type", enum: ["STARTING_PRICE", "FIXED_PRICE", "PER_UNIT", "CUSTOM_QUOTE"] },
            status: { label: "Status", enum: ["ACTIVE", "INACTIVE", "DRAFT", "OUT_OF_STOCK", "COMING_SOON"] },
            is_featured: { label: "Featured (Yes/No)", type: "boolean" },
            slug: { label: "Slug" },
            seo_title: { label: "SEO Title" },
            seo_description: { label: "SEO Description" },
            seo_keywords: { label: "SEO Keywords (; sep)" },
            image_url: { label: "Image URL" },
        },
    },
    SERVICE: {
        name: "Service", plural: "Services", key: null,
        fields: {
            title: { label: "Title", required: true },
            slug: { label: "Slug" },
            category: { label: "Category", enum: ["PRINTING", "BRANDING", "PACKAGING", "PROMOTIONAL"] },
            industries: { label: "Industry (multi, ; separated)", multi: true },
            short_description: { label: "Short Description" },
            description: { label: "Description" },
            starting_price: { label: "Starting Price", type: "number" },
            status: { label: "Status", enum: ["ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"] },
            is_featured: { label: "Featured (Yes/No)", type: "boolean" },
            seo_title: { label: "SEO Title" },
            seo_description: { label: "SEO Description" },
            seo_keywords: { label: "SEO Keywords (; sep)" },
        },
    },
    INDUSTRY: {
        name: "Industry", plural: "Industries", key: "slug",
        fields: {
            name: { label: "Name", required: true },
            slug: { label: "Slug" },
            short_description: { label: "Short Description" },
            description: { label: "Description" },
            status: { label: "Status", enum: ["ACTIVE", "INACTIVE", "DRAFT", "ARCHIVED"] },
            is_featured: { label: "Featured (Yes/No)", type: "boolean" },
            seo_title: { label: "SEO Title" },
            seo_description: { label: "SEO Description" },
        },
    },
    CATEGORY: {
        name: "Category", plural: "Categories", key: "slug",
        fields: {
            name: { label: "Name", required: true },
            slug: { label: "Slug" },
            description: { label: "Description" },
            status: { label: "Status", enum: ["ACTIVE", "INACTIVE", "ARCHIVED"] },
        },
    },
};

const STEPS = ["Upload", "Preview", "Map Columns", "Validate", "Preview Changes", "Confirm", "Complete"];

export default function AdminBulkImport() {
    const { toast } = useToast();
    const [step, setStep] = useState(0);
    const [entityType, setEntityType] = useState("PRODUCT");
    const [mode, setMode] = useState("BOTH");
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [mapping, setMapping] = useState({});
    const [parsing, setParsing] = useState(false);
    const [validation, setValidation] = useState(null);
    const [industries, setIndustries] = useState([]);
    const [existing, setExisting] = useState([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);

    const cfg = ENTITY_FIELDS[entityType];

    useEffect(() => {
        api.entities.Industry.list("sort_order", 500).then(setIndustries).catch(() => { });
    }, []);

    // load existing records for update/duplicate detection
    const loadExisting = useCallback(async () => {
        try {
            const items = await api.entities[entityType === "PRODUCT" ? "Product" : entityType === "SERVICE" ? "Service" : entityType === "INDUSTRY" ? "Industry" : "Category"].list("-created_date", 2000);
            setExisting(items);
        } catch (e) { setExisting([]); }
    }, [entityType]);

    const onFile = async (f) => {
        if (!f) return;
        setFile(f);
        setParsing(true);
        try {
            const { headers, rows } = await parseSpreadsheet(f);
            setHeaders(headers); setRows(rows);
            autoMap(headers);
            setStep(1);
        } catch (e) { toast({ title: "Could not read file", description: e.message, variant: "destructive" }); }
        finally { setParsing(false); }
    };

    const autoMap = (hdrs) => {
        const map = {};
        Object.keys(cfg.fields).forEach((dbField) => {
            const label = cfg.fields[dbField].label.toLowerCase();
            const match = hdrs.find((h) => h.toLowerCase().replace(/[_\s-]/g, "") === label.toLowerCase().replace(/[_\s-]/g, "").split(" ")[0]);
            if (match) map[dbField] = match;
        });
        setMapping(map);
    };

    const validate = async () => {
        await loadExisting();
        const keyField = cfg.key;
        const existingKeys = new Map(existing.filter((x) => x[keyField]).map((x) => [String(x[keyField]).toLowerCase(), x]));
        const seenKeys = new Map();
        const valid = [], invalid = [], duplicates = [];
        let missingRequired = 0;

        rows.forEach((row, idx) => {
            const rowNum = idx + 2;
            const errors = [];
            const rec = {};
            Object.entries(mapping).forEach(([dbField, col]) => {
                const raw = row[col];
                const def = cfg.fields[dbField];
                if (def?.type === "number") rec[dbField] = raw === "" || raw == null ? null : Number(raw);
                else if (def?.type === "boolean") rec[dbField] = ["yes", "true", "1", "y"].includes(String(raw).toLowerCase());
                else if (def?.multi) rec[dbField] = String(raw || "").split(/[;,]/).map((s) => s.trim()).filter(Boolean);
                else if (dbField === "seo_keywords") rec[dbField] = String(raw || "").split(/[;,]/).map((s) => s.trim()).filter(Boolean);
                else rec[dbField] = raw;
            });

            // required check
            const reqField = Object.keys(cfg.fields).find((f) => cfg.fields[f].required);
            if (reqField && (!rec[reqField] || rec[reqField] === "")) { errors.push({ field: cfg.fields[reqField].label, message: `${cfg.fields[reqField].label} missing` }); missingRequired++; }

            // number validation
            Object.entries(mapping).forEach(([dbField, col]) => {
                if (cfg.fields[dbField]?.type === "number" && row[col] !== "" && row[col] != null && isNaN(Number(row[col]))) {
                    errors.push({ field: cfg.fields[dbField].label, message: `Invalid ${cfg.fields[dbField].label}` });
                }
                if (cfg.fields[dbField]?.enum && row[col] && !cfg.fields[dbField].enum.includes(String(row[col]).toUpperCase().replace(/ /g, "_"))) {
                    // soft: will default later, not fatal
                }
            });

            // duplicate within file
            if (keyField && rec[keyField]) {
                const k = String(rec[keyField]).toLowerCase();
                if (seenKeys.has(k)) { errors.push({ field: cfg.fields[keyField].label, message: "Duplicate in file" }); duplicates.push(rowNum); }
                else seenKeys.set(k, rowNum);
            }

            if (errors.length) invalid.push({ row: rowNum, errors, data: rec });
            else valid.push({ row: rowNum, data: rec });
        });

        setValidation({ total: rows.length, valid: valid.length, invalid: invalid.length, duplicates: duplicates.length, missingRequired, validRows: valid, invalidRows: invalid });
        setStep(3);
    };

    const runImport = async () => {
        setImporting(true);
        const keyField = cfg.key;
        const existingMap = new Map(existing.filter((x) => x[keyField]).map((x) => [String(x[keyField]).toLowerCase(), x]));
        const indMap = new Map(industries.map((i) => [i.name.toLowerCase(), i]));
        const createdIndustries = [];
        const resolveIndustries = (names = []) => {
            const ids = [];
            for (const n of names) {
                const found = indMap.get(n.toLowerCase());
                if (found) ids.push(found.id);
                else {
                    // auto-create missing industry
                    const ni = { name: n, slug: slugify(n), status: "ACTIVE" };
                    // (created below in batch)
                    createdIndustries.push(ni);
                    indMap.set(n.toLowerCase(), { ...ni, id: "__pending__" + n });
                    ids.push(ni);
                }
            }
            return ids;
        };

        // auto-create missing industries first
        let createdIndCount = 0;
        const pendingIndNames = [...new Set(createdIndustries.map((i) => i.name))];
        const newIndMap = new Map();
        for (const name of pendingIndNames) {
            try {
                const created = await api.entities.Industry.create({ name, slug: slugify(name), status: "ACTIVE" });
                newIndMap.set(name.toLowerCase(), created.id); createdIndCount++;
            } catch (e) { }
        }

        let created = 0, updated = 0, skipped = 0;
        const errors = [];
        const entity = api.entities[entityType === "PRODUCT" ? "Product" : entityType === "SERVICE" ? "Service" : entityType === "INDUSTRY" ? "Industry" : "Category"];

        for (const { row: rowNum, data } of validation.validRows) {
            try {
                const payload = { ...data };
                // resolve industries for product/service
                if (payload.industries && Array.isArray(payload.industries) && payload.industries.length) {
                    if (typeof payload.industries[0] === "string") {
                        payload.industries = resolveIndustries(payload.industries).map((x) => (typeof x === "string" ? x : x.id)).map((id) => {
                            if (String(id).startsWith("__pending__")) return newIndMap.get(id.replace("__pending__", "").toLowerCase());
                            return id;
                        }).filter(Boolean);
                    }
                }
                // enum defaulting
                Object.keys(cfg.fields).forEach((f) => {
                    if (cfg.fields[f].enum && payload[f]) payload[f] = String(payload[f]).toUpperCase().replace(/ /g, "_");
                });
                if (cfg.fields.name && !payload.slug && payload.name) payload.slug = slugify(payload.name);
                if (cfg.fields.title && !payload.slug && payload.title) payload.slug = slugify(payload.title);

                // decide create vs update
                let doUpdate = false, existingRec = null;
                if (keyField && payload[keyField]) {
                    existingRec = existingMap.get(String(payload[keyField]).toLowerCase());
                    if (existingRec) doUpdate = true;
                }
                if (doUpdate && mode === "CREATE") { skipped++; continue; }
                if (!doUpdate && mode === "UPDATE") { skipped++; errors.push({ row: rowNum, field: keyField, message: `${cfg.fields[keyField].label} not found` }); continue; }

                if (doUpdate) { await entity.update(existingRec.id, payload); updated++; }
                else { await entity.create(payload); created++; }
            } catch (e) {
                errors.push({ row: rowNum, field: "", message: e.message || "Create/update failed" });
                skipped++;
            }
        }

        // build + upload error report if errors
        let errorReportUrl = "";
        if (validation.invalidRows.length || errors.length) {
            const allErrors = [
                ...validation.invalidRows.flatMap((r) => r.errors.map((e) => ({ row: r.row, field: e.field, message: e.message }))),
                ...errors,
            ];
            try {
                const errFile = await buildErrorReport(allErrors);
                const { file_url } = await api.integrations.Core.UploadPublicFile({ file: errFile });
                errorReportUrl = file_url;
            } catch (e) { }
        }

        // log import job
        try {
            await api.entities.ImportJob.create({
                file_name: file?.name || "import", entity_type: entityType, mode,
                total_rows: rows.length, created, updated, skipped,
                errors_count: validation.invalidRows.length + errors.length,
                status: "COMPLETED", error_report_url: errorReportUrl,
                summary: `${created} created, ${updated} updated, ${skipped} skipped${createdIndCount ? `, ${createdIndCount} industries auto-created` : ""}`,
            });
        } catch (e) { }

        setResult({ created, updated, skipped, errors: validation.invalidRows.length + errors.length, errorReportUrl, createdIndCount });
        setImporting(false);
        setStep(6);
    };

    const reset = () => { setStep(0); setFile(null); setHeaders([]); setRows([]); setMapping({}); setValidation(null); setResult(null); };

    const downloadTemplate = () => {
        const sample = [{ "Product Name": "Patient File", Category: "PRINTING", Industry: "Healthcare", Description: "Custom hospital patient file", Material: "300 GSM", Size: "A4", Finishing: "Matte", MOQ: 100, Price: 25, Status: "ACTIVE", "Product ID": "RK-PROD-0001" }];
        exportToExcel(sample, "product_import_template.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div><h1 className="font-heading font-extrabold text-2xl text-ink">Bulk Import</h1><p className="text-sm text-ink-soft">Upload Excel/CSV → map columns → validate → preview → import. Supports thousands of rows.</p></div>
                <button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold hover:bg-muted"><Download className="h-4 w-4" /> Download Template</button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-1 shrink-0">
                        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${i === step ? "bg-rk-red text-white" : i < step ? "bg-green-100 text-green-700" : "bg-muted text-ink-soft"}`}>
                            {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>} {s}
                        </div>
                        {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-ink-soft/40" />}
                    </div>
                ))}
            </div>

            {/* Step 0: Upload */}
            {step === 0 && (
                <div className="space-y-5 max-w-2xl">
                    <div className="rounded-2xl bg-white border border-black/8 p-5 space-y-4">
                        <div><label className="block text-sm font-semibold mb-2">What are you importing?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.keys(ENTITY_FIELDS).map((t) => (
                                    <button key={t} onClick={() => setEntityType(t)} className={`rounded-lg border p-3 text-sm font-semibold transition ${entityType === t ? "border-rk-red bg-rk-red/5 text-rk-red" : "border-black/10 hover:bg-muted"}`}>{ENTITY_FIELDS[t].plural || `${ENTITY_FIELDS[t].name}s`}</button>
                                ))}
                            </div>
                        </div>
                        <div><label className="block text-sm font-semibold mb-2">Import mode</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[["CREATE", "Add New Only"], ["UPDATE", "Update Existing Only"], ["BOTH", "Add + Update"]].map(([m, l]) => (
                                    <button key={m} onClick={() => setMode(m)} className={`rounded-lg border p-3 text-sm font-semibold transition ${mode === m ? "border-rk-red bg-rk-red/5 text-rk-red" : "border-black/10 hover:bg-muted"}`}>{l}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <label onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }} onDragOver={(e) => e.preventDefault()} className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/15 bg-white py-16 cursor-pointer hover:border-rk-red/50 transition">
                        {parsing ? <Loader2 className="h-8 w-8 animate-spin text-rk-red" /> : <UploadCloud className="h-8 w-8 text-ink-soft" />}
                        <div className="text-center"><p className="font-semibold text-ink">{parsing ? "Reading file..." : "Drag & drop Excel / CSV here"}</p><p className="text-sm text-ink-soft">or click to browse · .xlsx .xls .csv</p></div>
                        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
                    </label>
                </div>
            )}

            {/* Step 1: Preview */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm"><FileSpreadsheet className="h-5 w-5 text-green-600" /><span className="font-semibold">{file?.name}</span><span className="text-ink-soft">· {rows.length} rows · {headers.length} columns</span></div>
                    <div className="rounded-2xl bg-white border border-black/8 overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-muted/50"><tr>{headers.map((h) => <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-black/5">{rows.slice(0, 8).map((r, i) => (
                                <tr key={i}>{headers.map((h) => <td key={h} className="px-3 py-2 text-ink-soft max-w-[200px] truncate">{String(r[h] ?? "")}</td>)}</tr>
                            ))}</tbody>
                        </table>
                        {rows.length > 8 && <p className="p-3 text-xs text-ink-soft text-center">Showing 8 of {rows.length} rows</p>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setStep(0)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Back</button>
                        <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold">Map Columns <ArrowRight className="h-4 w-4" /></button>
                    </div>
                </div>
            )}

            {/* Step 2: Map Columns */}
            {step === 2 && (
                <div className="space-y-4">
                    <p className="text-sm text-ink-soft">Map each Excel column to a database field. We auto-matched by name — adjust as needed.</p>
                    <div className="rounded-2xl bg-white border border-black/8 divide-y divide-black/5">
                        {Object.keys(cfg.fields).map((dbField) => (
                            <div key={dbField} className="flex items-center gap-3 px-4 py-3">
                                <div className="w-48"><span className="text-sm font-semibold text-ink">{cfg.fields[dbField].label}</span>{cfg.fields[dbField].required && <span className="text-rk-red"> *</span>}</div>
                                <ArrowRight className="h-4 w-4 text-ink-soft/40" />
                                <select className="rk-input flex-1 max-w-xs" value={mapping[dbField] || ""} onChange={(e) => setMapping((m) => ({ ...m, [dbField]: e.target.value }))}>
                                    <option value="">— Not mapped —</option>
                                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Back</button>
                        <button onClick={validate} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold">Validate Data <ArrowRight className="h-4 w-4" /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Validate */}
            {step === 3 && validation && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            ["Total Rows", validation.total, "text-ink"],
                            ["Valid", validation.valid, "text-green-600"],
                            ["Invalid", validation.invalid, "text-red-500"],
                            ["Duplicates", validation.duplicates, "text-amber-600"],
                            ["Missing Required", validation.missingRequired, "text-amber-600"],
                        ].map(([l, v, c]) => (
                            <div key={l} className="rounded-xl bg-white border border-black/8 p-4"><p className={`text-2xl font-heading font-extrabold ${c}`}>{v}</p><p className="text-xs text-ink-soft">{l}</p></div>
                        ))}
                    </div>
                    {validation.invalidRows.length > 0 && (
                        <div className="rounded-2xl bg-white border border-black/8 overflow-x-auto max-h-72">
                            <table className="w-full text-xs">
                                <thead className="bg-red-50 sticky top-0"><tr><th className="text-left px-3 py-2 font-semibold">Row</th><th className="text-left px-3 py-2 font-semibold">Issues</th></tr></thead>
                                <tbody className="divide-y divide-black/5">{validation.invalidRows.slice(0, 50).map((r) => (
                                    <tr key={r.row}><td className="px-3 py-2 font-mono">{r.row}</td><td className="px-3 py-2 text-red-600">{r.errors.map((e) => e.message).join("; ")}</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm"><AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /><span>Invalid rows will be skipped. Valid rows continue importing. A downloadable error report is generated after import.</span></div>
                    <div className="flex gap-2">
                        <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Back</button>
                        <button onClick={() => setStep(4)} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold">Preview Changes <ArrowRight className="h-4 w-4" /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Preview Changes */}
            {step === 4 && validation && (
                <div className="space-y-4">
                    <p className="text-sm text-ink-soft">{validation.valid} records will be processed ({mode === "CREATE" ? "create only" : mode === "UPDATE" ? "update only" : "create or update by " + (cfg.key || "name")}).</p>
                    <div className="rounded-2xl bg-white border border-black/8 overflow-x-auto max-h-96">
                        <table className="w-full text-xs">
                            <thead className="bg-muted/50 sticky top-0"><tr>{Object.keys(mapping).filter((f) => mapping[f]).slice(0, 6).map((f) => <th key={f} className="text-left px-3 py-2 font-semibold">{cfg.fields[f].label}</th>)}</tr></thead>
                            <tbody className="divide-y divide-black/5">{validation.validRows.slice(0, 15).map((r) => (
                                <tr key={r.row}>{Object.keys(mapping).filter((f) => mapping[f]).slice(0, 6).map((f) => <td key={f} className="px-3 py-2 text-ink-soft max-w-[180px] truncate">{String(r.data[f] ?? "")}</td>)}</tr>
                            ))}</tbody>
                        </table>
                        {validation.validRows.length > 15 && <p className="p-3 text-xs text-ink-soft text-center">Showing 15 of {validation.validRows.length} valid rows</p>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setStep(3)} className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Back</button>
                        <button onClick={() => setStep(5)} className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red text-white px-4 py-2 text-sm font-semibold">Confirm Import <ArrowRight className="h-4 w-4" /></button>
                    </div>
                </div>
            )}

            {/* Step 5: Confirm */}
            {step === 5 && (
                <div className="space-y-4 max-w-lg">
                    <div className="rounded-2xl bg-white border border-black/8 p-6 text-center">
                        <Layers className="h-10 w-10 text-rk-red mx-auto mb-3" />
                        <h2 className="font-heading font-bold text-xl">Ready to import</h2>
                        <p className="text-sm text-ink-soft mt-1">{validation.valid} {cfg.name.toLowerCase()}s will be {mode === "UPDATE" ? "updated" : mode === "CREATE" ? "created" : "created or updated"}. {validation.invalid} rows will be skipped.</p>
                        {cfg.key && <p className="text-xs text-ink-soft mt-2">Matching by <span className="font-mono font-semibold">{cfg.fields[cfg.key].label}</span> · missing industries auto-created</p>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setStep(4)} className="flex-1 rounded-lg border border-black/10 py-2.5 text-sm font-semibold"><ArrowLeft className="h-4 w-4 inline" /> Back</button>
                        <button onClick={runImport} disabled={importing} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold disabled:opacity-50">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {importing ? "Importing..." : "Start Import"}</button>
                    </div>
                </div>
            )}

            {/* Step 6: Complete */}
            {step === 6 && result && (
                <div className="space-y-4 max-w-lg">
                    <div className="rounded-2xl bg-white border border-black/8 p-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h2 className="font-heading font-bold text-xl">Import Complete</h2>
                        <div className="grid grid-cols-4 gap-3 mt-5">
                            <div><p className="text-2xl font-heading font-extrabold text-green-600">{result.created}</p><p className="text-xs text-ink-soft">Imported</p></div>
                            <div><p className="text-2xl font-heading font-extrabold text-blue-600">{result.updated}</p><p className="text-xs text-ink-soft">Updated</p></div>
                            <div><p className="text-2xl font-heading font-extrabold text-amber-600">{result.skipped}</p><p className="text-xs text-ink-soft">Skipped</p></div>
                            <div><p className="text-2xl font-heading font-extrabold text-red-500">{result.errors}</p><p className="text-xs text-ink-soft">Errors</p></div>
                        </div>
                        {result.createdIndCount > 0 && <p className="text-xs text-ink-soft mt-3">{result.createdIndCount} new industries auto-created</p>}
                    </div>
                    {result.errorReportUrl && (
                        <a href={result.errorReportUrl} download="IMPORT_ERRORS.xlsx" className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-600 py-2.5 text-sm font-semibold w-full"><Download className="h-4 w-4" /> Download Error Report (IMPORT_ERRORS.xlsx)</a>
                    )}
                    <div className="flex gap-2">
                        <button onClick={reset} className="flex-1 rounded-lg bg-rk-red text-white py-2.5 text-sm font-semibold">Import Another File</button>
                        <a href="/admin/import-history" className="flex-1 rounded-lg border border-black/10 py-2.5 text-sm font-semibold text-center">View History</a>
                    </div>
                </div>
            )}
        </div>
    );
}