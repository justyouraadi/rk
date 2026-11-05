import * as XLSX from "xlsx";

/** URL/file-safe slug from a string */
export function slugify(s = "") {
    return String(s)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
}

/** Generate a sequential-looking SKU: RK-PROD-0001 */
export function genSKU(existing = [], prefix = "RK-PROD") {
    let max = 0;
    existing.forEach((p) => {
        const m = String(p.sku || "").match(/(\d+)$/);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

/**
 * Completeness check for a product.
 * Returns { complete: boolean, missing: string[], score: number }
 */
export function checkCompleteness(p = {}) {
    const missing = [];
    if (!p.name) missing.push("Name");
    if (!p.image_url) missing.push("Image");
    if (!p.description) missing.push("Description");
    if (!p.industries || p.industries.length === 0) missing.push("Industry");
    if (!p.category) missing.push("Category");
    if (!p.slug) missing.push("Slug");
    if (p.starting_price == null && !p.custom_pricing) missing.push("Price");
    if (p.moq == null) missing.push("MOQ");
    if (!p.seo_title) missing.push("SEO Title");
    const score = Math.round(((9 - missing.length) / 9) * 100);
    return { complete: missing.length === 0, missing, score: Math.max(0, score) };
}

/** Parse an uploaded Excel/CSV file into { headers, rows } */
export function parseSpreadsheet(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
                const headers = json.length ? Object.keys(json[0]) : [];
                resolve({ headers, rows: json });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/** Trigger a browser download for a Blob */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export array-of-objects to .xlsx */
export function exportToExcel(rows = [], filename = "export.xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([out], { type: "application/octet-stream" }), filename);
}

/** Export array-of-objects to .csv */
export function exportToCSV(rows = [], filename = "export.csv") {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
        headers.map(esc).join(","),
        ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
    ].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

/** Build a downloadable error report xlsx from [{ row, field, message }] and return its public URL */
export async function buildErrorReport(errors = []) {
    const ws = XLSX.utils.json_to_sheet(
        errors.map((e) => ({ Row: e.row, Field: e.field || "", Issue: e.message }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Import Errors");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    return new File([file], "IMPORT_ERRORS.xlsx", { type: "application/octet-stream" });
}

/** Product export row shape */
export function productToExportRow(p, industryNameMap = {}) {
    return {
        "Product ID": p.sku || "",
        "Product Name": p.name || "",
        Category: p.category || "",
        Industry: (p.industries || []).map((id) => industryNameMap[id] || id).join("; "),
        Description: p.description || "",
        Material: p.material || (p.materials || []).join("; "),
        Size: p.size || (p.sizes || []).join("; "),
        Finishing: p.finishing || (p.finishings || []).join("; "),
        MOQ: p.moq ?? "",
        Price: p.starting_price ?? "",
        "Price Type": p.price_type || "",
        Status: p.status || "",
        Featured: p.is_featured ? "Yes" : "No",
        Slug: p.slug || "",
        "SEO Title": p.seo_title || "",
        "SEO Description": p.seo_description || "",
        "SEO Keywords": (p.seo_keywords || []).join("; "),
        "Image URL": p.image_url || "",
    };
}

/** Suggested alt text from a product name */
export function suggestAltText(name = "") {
    const base = name.trim();
    if (!base) return "";
    return `${base} Printing in Kotputli | RK Printers`;
}