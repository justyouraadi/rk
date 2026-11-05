import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Check, ChevronRight, Upload, MessageCircle, Loader2, File as FileIcon } from "lucide-react";
import { BRAND, waLink, genId, SERVICE_CATEGORIES } from "@/lib/brand";
import { useEnquiry } from "@/lib/EnquiryContext";

const STEPS = ["Your Info", "Requirement", "Upload Files", "Additional", "Done"];

export default function GetQuote() {
    const { toast } = useToast();
    const [params] = useSearchParams();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [leadId, setLeadId] = useState(null);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        name: "", phone: "", whatsapp: "", email: "", business_name: "",
        service: "", product: "", product_id: "", industry: "", category: "",
        variant: "", quality: "", gsm: "", material: "", size: "", finishing: "",
        quantity: "", delivery_date: "", additional_requirements: "",
    });
    const { items: enquiryItems, clearAll: clearEnquiry } = useEnquiry();
    const fromEnquiry = params.get("from_enquiry");

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    useEffect(() => {
        const product = params.get("product");
        const productId = params.get("product_id");
        const category = params.get("category");
        const industry = params.get("industry");
        const variant = params.get("variant");
        const material = params.get("material");
        const size = params.get("size");
        const finishing = params.get("finishing");
        const quantity = params.get("quantity");
        if (product || category || industry || variant) {
            setForm((f) => ({
                ...f,
                product: product || f.product,
                product_id: productId || f.product_id,
                service: category || f.service,
                category: category || f.category,
                industry: industry || f.industry,
                variant: variant || f.variant,
                material: material || f.material,
                size: size || f.size,
                finishing: finishing || f.finishing,
                quantity: quantity || f.quantity,
                requirement: [
                    industry && `Industry: ${industry}`,
                    variant && `Variant: ${variant}`,
                    material && `Material: ${material}`,
                    size && `Size: ${size}`,
                    finishing && `Finishing: ${finishing}`,
                    quantity && `Quantity: ${quantity}`,
                ].filter(Boolean).join(" · ") || f.requirement,
            }));
        }
        if (fromEnquiry && enquiryItems.length > 0) {
            const lines = enquiryItems.map((it, i) => `${i + 1}. ${it.product_name}${it.variant ? ` (${it.variant})` : ""}${it.material ? ` · ${it.material}` : ""}${it.size ? ` · ${it.size}` : ""}${it.finishing ? ` · ${it.finishing}` : ""}${it.quantity ? ` × ${it.quantity}` : ""}`);
            setForm((f) => ({ ...f, service: "OTHER", product: `Multiple items (${enquiryItems.length})`, requirement: `Enquiry for ${enquiryItems.length} item(s):\n${lines.join("\n")}` }));
        }
        if (params.get("custom")) setForm((f) => ({ ...f, service: "OTHER", requirement: "Custom printing requirement — please describe below." }));
        const bundle = params.get("bundle");
        if (bundle) setForm((f) => ({ ...f, service: "OTHER", product: bundle, requirement: `Bundle request: ${bundle}` }));
    }, [params, fromEnquiry, enquiryItems]);

    const handleFiles = async (fileList) => {
        const arr = Array.from(fileList);
        if (!arr.length) return;
        setUploading(true);
        try {
            const uploaded = [];
            for (const file of arr) {
                const { file_uri } = await api.integrations.Core.UploadPrivateFile({ file });
                uploaded.push(file_uri);
            }
            setFiles((prev) => [...prev, ...uploaded]);
            toast({ title: "Files uploaded", description: `${arr.length} file(s) added.` });
        } catch (e) {
            toast({ title: "Upload failed", description: e.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const canNext = () => {
        if (step === 0) return form.name && form.phone;
        if (step === 1) return form.service && form.requirement;
        return true;
    };

    const submit = async () => {
        setSaving(true);
        const id = genId("LEAD");
        try {
            await api.entities.Lead.create({
                lead_id: id,
                name: form.name,
                phone: form.phone,
                whatsapp: form.whatsapp || form.phone,
                email: form.email,
                business_name: form.business_name,
                requirement: form.requirement || `${form.service} - ${form.product || "General"}`,
                service: form.service,
                product: form.product,
                product_id: form.product_id,
                industry: form.industry,
                category: form.category,
                variant: form.variant,
                quality: form.variant,
                material: form.material,
                gsm: form.gsm,
                size: form.size,
                finishing: form.finishing,
                quantity: form.quantity,
                delivery_date: form.delivery_date,
                additional_requirements: form.additional_requirements,
                file_urls: files,
                status: "NEW",
                source: "WEBSITE",
            });
            await api.entities.Notification.create({
                title: "New Lead Received",
                message: `${form.name} requested a quote for ${form.service}.`,
                type: "LEAD",
                audience: "ADMIN",
                link: "/admin/leads",
            }).catch(() => { });
            setLeadId(id);
            setStep(4);
            if (fromEnquiry) clearEnquiry();
        } catch (e) {
            toast({ title: "Could not submit", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 lg:py-16">
            <div className="text-center mb-10">
                <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">GET A QUOTE</span>
                <h1 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">Request Your Custom Quote</h1>
                <p className="mt-3 text-ink-soft">Fill in your details — our team will reach out on WhatsApp within hours.</p>
            </div>

            {step < 4 && (
                <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
                    {STEPS.slice(0, 4).map((s, i) => (
                        <div key={i} className="flex items-center flex-1 last:flex-none">
                            <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= step ? "bg-rk-red text-white" : "bg-muted text-ink-soft"}`}>
                                {i < step ? <Check className="h-4 w-4" /> : i + 1}
                            </div>
                            {i < 3 && <div className={`h-0.5 flex-1 mx-1 ${i < step ? "bg-rk-red" : "bg-muted"}`} />}
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm">
                {step === 0 && (
                    <div className="space-y-4">
                        <Field label="Full Name *"><input className="rk-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" /></Field>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Mobile *"><input className="rk-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit mobile" /></Field>
                            <Field label="WhatsApp"><input className="rk-input" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="If different" /></Field>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Email"><input className="rk-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></Field>
                            <Field label="Business Name"><input className="rk-input" value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Your company" /></Field>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        {fromEnquiry && enquiryItems.length > 0 && (
                            <div className="rounded-xl bg-rk-red/5 border border-rk-red/20 p-4">
                                <p className="text-sm font-semibold text-ink mb-2">Your Enquiry List ({enquiryItems.length} items)</p>
                                <div className="space-y-1">
                                    {enquiryItems.map((it, i) => (
                                        <div key={i} className="text-xs text-ink-soft">
                                            <span className="font-semibold text-ink">{i + 1}. {it.product_name}</span>
                                            {it.variant && ` · ${it.variant}`}
                                            {it.material && ` · ${it.material}`}
                                            {it.size && ` · ${it.size}`}
                                            {it.finishing && ` · ${it.finishing}`}
                                            {it.quantity && ` × ${it.quantity}`}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Field label="Service *">
                            <select className="rk-input" value={form.service} onChange={(e) => set("service", e.target.value)}>
                                <option value="">Select a service</option>
                                {SERVICE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                                <option value="OTHER">Other</option>
                            </select>
                        </Field>
                        <Field label="Product / Item"><input className="rk-input" value={form.product} onChange={(e) => set("product", e.target.value)} placeholder="e.g. Visiting Cards, Banner, Box" /></Field>
                        <Field label="Variant / Quality"><input className="rk-input" value={form.variant} onChange={(e) => set("variant", e.target.value)} placeholder="e.g. Premium Matte, Standard, Foil" /></Field>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Quantity"><input className="rk-input" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="e.g. 500" /></Field>
                            <Field label="Size"><input className="rk-input" value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. A4, 3x2 ft" /></Field>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Material"><input className="rk-input" value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. 300 GSM" /></Field>
                            <Field label="Finishing"><input className="rk-input" value={form.finishing} onChange={(e) => set("finishing", e.target.value)} placeholder="e.g. Matte, Glossy" /></Field>
                        </div>
                        <Field label="Requirement Details *">
                            <textarea className="rk-input min-h-[90px]" value={form.requirement} onChange={(e) => set("requirement", e.target.value)} placeholder="Describe what you need..." />
                        </Field>
                        <Field label="Expected Delivery Date"><input className="rk-input" type="date" value={form.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} /></Field>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-ink-soft">Upload your design files (PDF, JPG, PNG, AI, CDR, PSD, ZIP). Max 25MB each.</p>
                        <label className="block rounded-xl border-2 border-dashed border-black/15 p-8 text-center cursor-pointer hover:border-rk-red/50 transition">
                            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.psd,.zip" />
                            {uploading ? <Loader2 className="h-8 w-8 mx-auto animate-spin text-rk-red" /> : <Upload className="h-8 w-8 mx-auto text-ink-soft" />}
                            <p className="mt-3 text-sm font-medium text-ink">{uploading ? "Uploading..." : "Click to upload files"}</p>
                            <p className="text-xs text-ink-soft mt-1">Files are stored privately — no public URL, so access follows your app's permissions.</p>
                        </label>
                        {files.length > 0 && (
                            <div className="space-y-2">
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                                        <FileIcon className="h-4 w-4 text-rk-red" />
                                        <span className="truncate">File {i + 1}</span>
                                        <button className="ml-auto text-xs text-ink-soft hover:text-rk-red" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-ink-soft">You can also skip this step and share files later on WhatsApp.</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <Field label="Additional Requirements">
                            <textarea className="rk-input min-h-[120px]" value={form.additional_requirements} onChange={(e) => set("additional_requirements", e.target.value)} placeholder="Any special instructions, references, or notes..." />
                        </Field>
                        <div className="rounded-xl bg-muted p-4 text-sm space-y-1.5">
                            <p className="font-semibold text-ink mb-2">Review your request</p>
                            <Row k="Name" v={form.name} />
                            <Row k="Phone" v={form.phone} />
                            <Row k="Product" v={form.product || "—"} />
                            {form.variant && <Row k="Variant" v={form.variant} />}
                            {form.material && <Row k="Material" v={form.material} />}
                            {form.size && <Row k="Size" v={form.size} />}
                            {form.finishing && <Row k="Finishing" v={form.finishing} />}
                            {form.quantity && <Row k="Quantity" v={form.quantity} />}
                            <Row k="Files" v={`${files.length} file(s)`} />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center py-8">
                        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-rk-red/10">
                            <Check className="h-8 w-8 text-rk-red" />
                        </div>
                        <h2 className="mt-5 font-heading font-extrabold text-2xl text-ink">Request Received!</h2>
                        <p className="mt-2 text-ink-soft">Your quotation request has been received. Our team will contact you shortly.</p>
                        <div className="mt-5 inline-block rounded-lg bg-muted px-5 py-3">
                            <p className="text-xs text-ink-soft">Your Enquiry ID</p>
                            <p className="font-heading font-extrabold text-lg text-rk-red">{leadId}</p>
                        </div>
                        <p className="mt-2 text-xs text-ink-soft">Timestamp: {new Date().toLocaleString("en-IN")}</p>
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <a href={waLink(`Hello, I just submitted a quote request. My Enquiry ID is ${leadId}.`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white hover:opacity-90"><MessageCircle className="h-4 w-4" /> Send on WhatsApp</a>
                        </div>
                    </div>
                )}

                {step < 4 && (
                    <div className="flex justify-between mt-8 pt-6 border-t border-black/8">
                        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40 hover:bg-muted transition">Back</button>
                        {step < 3 ? (
                            <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 transition">Next <ChevronRight className="h-4 w-4" /></button>
                        ) : (
                            <button onClick={submit} disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 transition">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit Request
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">{label}</label>
            {children}
        </div>
    );
}
function Row({ k, v }) {
    return <p className="flex justify-between text-xs"><span className="text-ink-soft">{k}</span><span className="font-medium text-ink">{v}</span></p>;
}