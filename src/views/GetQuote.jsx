import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Check, ChevronRight, Upload, MessageCircle, Loader2, File as FileIcon, X, AlertCircle } from "lucide-react";
import { BRAND, waLink, genId, SERVICE_CATEGORIES } from "@/lib/brand";
import { useEnquiry } from "@/lib/EnquiryContext";

const STEPS = ["Your Info", "Requirement", "Upload Files", "Additional", "Done"];

function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GetQuote() {
    const { toast } = useToast();
    const [params] = useSearchParams();
    const fileInputRef = useRef(null);

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [leadId, setLeadId] = useState(null);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [stepErrors, setStepErrors] = useState({});

    const [form, setForm] = useState({
        name: "", phone: "", whatsapp: "", email: "", business_name: "",
        service: "", product: "", product_id: "", industry: "", category: "",
        variant: "", quality: "", gsm: "", material: "", size: "", finishing: "",
        quantity: "", delivery_date: "", additional_requirements: "",
        requirement: "",
    });

    const { items: enquiryItems, clearAll: clearEnquiry } = useEnquiry();
    const fromEnquiry = params.get("from_enquiry");

    const set = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        if (stepErrors[k]) {
            setStepErrors((errs) => ({ ...errs, [k]: "" }));
        }
    };

    useEffect(() => {
        const product = params.get("product");
        const productId = params.get("product_id");
        const category = params.get("category");
        const service = params.get("service");
        const industry = params.get("industry");
        const variant = params.get("variant");
        const material = params.get("material");
        const size = params.get("size");
        const finishing = params.get("finishing");
        const quantity = params.get("quantity");

        if (product || category || service || industry || variant) {
            setForm((f) => {
                const s = service || category || f.service;
                return {
                    ...f,
                    product: product || f.product,
                    product_id: productId || f.product_id,
                    service: s,
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
                };
            });
        }
        if (fromEnquiry && enquiryItems.length > 0) {
            const lines = enquiryItems.map((it, i) => `${i + 1}. ${it.product_name}${it.variant ? ` (${it.variant})` : ""}${it.material ? ` · ${it.material}` : ""}${it.size ? ` · ${it.size}` : ""}${it.finishing ? ` · ${it.finishing}` : ""}${it.quantity ? ` × ${it.quantity}` : ""}`);
            setForm((f) => ({
                ...f,
                service: "OTHER",
                product: `Multiple items (${enquiryItems.length})`,
                requirement: `Enquiry for ${enquiryItems.length} item(s):\n${lines.join("\n")}`,
            }));
        }
        if (params.get("custom")) {
            setForm((f) => ({ ...f, service: "OTHER", requirement: "Custom printing requirement — please describe below." }));
        }
        const bundle = params.get("bundle");
        if (bundle) {
            setForm((f) => ({ ...f, service: "OTHER", product: bundle, requirement: `Bundle request: ${bundle}` }));
        }
    }, [params, fromEnquiry, enquiryItems]);

    const handleFiles = async (fileList) => {
        const arr = Array.from(fileList || []);
        if (!arr.length) return;
        setUploadError("");
        setUploading(true);

        const newUploaded = [];
        let failedCount = 0;

        for (const file of arr) {
            try {
                const result = await api.integrations.Core.UploadPrivateFile({ file });
                const url = result.file_url || result.file_uri || result.url;
                if (!url) throw new Error("No URL returned from upload");

                newUploaded.push({
                    name: file.name,
                    size: file.size,
                    url,
                });
            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
                failedCount++;
                setUploadError(`Failed to upload "${file.name}": ${err.message || "Network issue"}`);
            }
        }

        if (newUploaded.length > 0) {
            setFiles((prev) => [...prev, ...newUploaded]);
            toast({
                title: "Files uploaded",
                description: `${newUploaded.length} file(s) added successfully.`,
            });
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setUploading(false);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const validateCurrentStep = () => {
        const errors = {};
        if (step === 0) {
            if (!form.name || !form.name.trim()) errors.name = "Full Name is required";
            if (!form.phone || !form.phone.trim()) {
                errors.phone = "Mobile number is required";
            } else if (!/^[0-9+ -]{8,15}$/.test(form.phone.trim())) {
                errors.phone = "Please enter a valid phone number";
            }
        } else if (step === 1) {
            if (!form.service) errors.service = "Please select a service category";
            // If requirement is blank, auto-fill it from other fields
            if (!form.requirement || !form.requirement.trim()) {
                const autoReq = `${form.service || "Printing"} inquiry for ${form.product || "custom job"} (Qty: ${form.quantity || "TBD"})`;
                setForm((f) => ({ ...f, requirement: autoReq }));
            }
        }
        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setStep((s) => Math.min(STEPS.length - 1, s + 1));
        }
    };

    const submit = async () => {
        setSubmitError("");
        setSaving(true);
        const id = genId("LEAD");

        // Prepare file URLs
        const fileUrls = files.map((f) => (typeof f === "string" ? f : f.url)).filter(Boolean);

        const requirementText = form.requirement && form.requirement.trim()
            ? form.requirement.trim()
            : `${form.service || "Printing"} - ${form.product || "Custom Requirement"}`;

        try {
            await api.entities.Lead.create({
                lead_id: id,
                name: form.name.trim(),
                phone: form.phone.trim(),
                whatsapp: (form.whatsapp && form.whatsapp.trim()) || form.phone.trim(),
                email: (form.email && form.email.trim()) || null,
                business_name: (form.business_name && form.business_name.trim()) || null,
                requirement: requirementText,
                service: form.service || "OTHER",
                product: form.product || null,
                product_id: form.product_id || null,
                industry: form.industry || null,
                category: form.category || null,
                variant: form.variant || null,
                quality: form.variant || null,
                material: form.material || null,
                gsm: form.gsm || null,
                size: form.size || null,
                finishing: form.finishing || null,
                quantity: form.quantity || null,
                delivery_date: form.delivery_date || null,
                additional_requirements: form.additional_requirements || null,
                file_urls: fileUrls,
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
            toast({
                title: "Quotation request submitted!",
                description: `Your Enquiry ID is ${id}. Our team will contact you shortly.`,
            });
        } catch (e) {
            console.error("Submission failed:", e);
            setSubmitError(e.message || "Failed to submit quote request. Please try again or WhatsApp us directly.");
            toast({
                title: "Could not submit",
                description: e.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 lg:py-16">
            <div className="text-center mb-10">
                <span className="text-xs font-semibold tracking-[0.2em] text-rk-red uppercase">GET A QUOTE</span>
                <h1 className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl text-ink">Request Your Custom Quote</h1>
                <p className="mt-3 text-ink-soft">Fill in your details — our estimation team will reach out on WhatsApp/Call with competitive rates.</p>
            </div>

            {step < 4 && (
                <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
                    {STEPS.slice(0, 4).map((s, i) => (
                        <div key={i} className="flex items-center flex-1 last:flex-none">
                            <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-colors ${i <= step ? "bg-rk-red text-white" : "bg-muted text-ink-soft"}`}>
                                {i < step ? <Check className="h-4 w-4" /> : i + 1}
                            </div>
                            {i < 3 && <div className={`h-0.5 flex-1 mx-1 transition-colors ${i < step ? "bg-rk-red" : "bg-muted"}`} />}
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm">
                {submitError && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Unable to submit request</p>
                            <p className="text-xs mt-0.5">{submitError}</p>
                        </div>
                    </div>
                )}

                {step === 0 && (
                    <div className="space-y-4">
                        <Field label="Full Name *" error={stepErrors.name}>
                            <input
                                className={`rk-input ${stepErrors.name ? "border-red-400 focus:border-red-500" : ""}`}
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                                placeholder="Your full name"
                                autoFocus
                            />
                        </Field>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Mobile Number *" error={stepErrors.phone}>
                                <input
                                    className={`rk-input ${stepErrors.phone ? "border-red-400 focus:border-red-500" : ""}`}
                                    value={form.phone}
                                    onChange={(e) => set("phone", e.target.value)}
                                    placeholder="10-digit mobile (e.g. 9876543210)"
                                />
                            </Field>
                            <Field label="WhatsApp (Optional)">
                                <input
                                    className="rk-input"
                                    value={form.whatsapp}
                                    onChange={(e) => set("whatsapp", e.target.value)}
                                    placeholder="If different from mobile"
                                />
                            </Field>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Email Address (Optional)">
                                <input
                                    className="rk-input"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => set("email", e.target.value)}
                                    placeholder="For receiving PDF quotation"
                                />
                            </Field>
                            <Field label="Company / Business Name">
                                <input
                                    className="rk-input"
                                    value={form.business_name}
                                    onChange={(e) => set("business_name", e.target.value)}
                                    placeholder="Your firm or shop name"
                                />
                            </Field>
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
                        <Field label="Service Category *" error={stepErrors.service}>
                            <select
                                className={`rk-input ${stepErrors.service ? "border-red-400 focus:border-red-500" : ""}`}
                                value={form.service}
                                onChange={(e) => set("service", e.target.value)}
                            >
                                <option value="">Select a service category</option>
                                {SERVICE_CATEGORIES.map((c) => (
                                    <option key={c.key} value={c.key}>{c.label}</option>
                                ))}
                                <option value="OTHER">Other / Custom Job</option>
                            </select>
                        </Field>
                        <Field label="Product / Item Name">
                            <input
                                className="rk-input"
                                value={form.product}
                                onChange={(e) => set("product", e.target.value)}
                                placeholder="e.g. Visiting Cards, Flex Banner, Product Box, Letterhead"
                            />
                        </Field>
                        <Field label="Variant / Paper Quality">
                            <input
                                className="rk-input"
                                value={form.variant}
                                onChange={(e) => set("variant", e.target.value)}
                                placeholder="e.g. 350 GSM Matte Laminated, Star Flex, Corrugated"
                            />
                        </Field>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Quantity">
                                <input
                                    className="rk-input"
                                    value={form.quantity}
                                    onChange={(e) => set("quantity", e.target.value)}
                                    placeholder="e.g. 500 pcs, 1000 units"
                                />
                            </Field>
                            <Field label="Size / Dimensions">
                                <input
                                    className="rk-input"
                                    value={form.size}
                                    onChange={(e) => set("size", e.target.value)}
                                    placeholder="e.g. 3.5 x 2 in, A4, 10 x 4 ft"
                                />
                            </Field>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Material">
                                <input
                                    className="rk-input"
                                    value={form.material}
                                    onChange={(e) => set("material", e.target.value)}
                                    placeholder="e.g. Art Card, Vinyl, Canvas"
                                />
                            </Field>
                            <Field label="Finishing / Coating">
                                <input
                                    className="rk-input"
                                    value={form.finishing}
                                    onChange={(e) => set("finishing", e.target.value)}
                                    placeholder="e.g. Gold Foil, Spot UV, Gloss Lamination"
                                />
                            </Field>
                        </div>
                        <Field label="Requirement Details">
                            <textarea
                                className="rk-input min-h-[90px]"
                                value={form.requirement}
                                onChange={(e) => set("requirement", e.target.value)}
                                placeholder="Describe any specifics about your requirement, design status, or questions..."
                            />
                        </Field>
                        <Field label="Expected Delivery Date">
                            <input
                                className="rk-input"
                                type="date"
                                value={form.delivery_date}
                                onChange={(e) => set("delivery_date", e.target.value)}
                            />
                        </Field>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-ink">Upload Your Design / Artwork</h3>
                            <p className="text-sm text-ink-soft mt-1">Upload your design files (PDF, JPG, PNG, AI, CDR, PSD, ZIP). Max 50MB each.</p>
                        </div>

                        {uploadError && (
                            <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{uploadError}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setUploadError("")}
                                    className="font-semibold text-red-800 hover:underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={`block rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                                uploading
                                    ? "bg-muted/50 border-rk-red/40 cursor-not-allowed"
                                    : "border-black/15 hover:border-rk-red/50 hover:bg-rk-red/5"
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => handleFiles(e.target.files)}
                                accept=".pdf,.jpg,.jpeg,.png,.ai,.cdr,.psd,.zip,.eps"
                            />
                            {uploading ? (
                                <div className="space-y-2">
                                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-rk-red" />
                                    <p className="text-sm font-semibold text-ink">Uploading file(s)...</p>
                                    <p className="text-xs text-ink-soft">Please wait while your design files are processed securely.</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 mx-auto text-ink-soft" />
                                    <p className="mt-3 text-sm font-medium text-ink">Click or browse to upload artwork files</p>
                                    <p className="text-xs text-ink-soft mt-1">Accepts PDF, JPG, PNG, CorelDraw (.CDR), Illustrator (.AI), Photoshop (.PSD), ZIP</p>
                                </>
                            )}
                        </div>

                        {files.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <p className="text-xs font-semibold text-ink uppercase tracking-wider">Uploaded Files ({files.length})</p>
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2.5 rounded-lg bg-muted/60 border border-black/5 px-3.5 py-2.5 text-sm">
                                        <FileIcon className="h-4 w-4 text-rk-red shrink-0" />
                                        <span className="truncate font-medium text-ink max-w-[280px] sm:max-w-md">
                                            {typeof f === "string" ? `File ${i + 1}` : f.name || `File ${i + 1}`}
                                        </span>
                                        {f.size && (
                                            <span className="text-xs text-ink-soft shrink-0">({formatFileSize(f.size)})</span>
                                        )}
                                        <button
                                            type="button"
                                            className="ml-auto text-xs text-ink-soft hover:text-rk-red p-1"
                                            onClick={() => removeFile(i)}
                                            title="Remove file"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-3.5 text-xs text-amber-900 leading-relaxed">
                            💡 <strong>Don't have print-ready artwork right now?</strong> You can skip this step! Click <strong>Next</strong> to continue, and our design team can receive your files directly on WhatsApp later.
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <Field label="Special Instructions / Notes">
                            <textarea
                                className="rk-input min-h-[110px]"
                                value={form.additional_requirements}
                                onChange={(e) => set("additional_requirements", e.target.value)}
                                placeholder="Any special packaging instructions, dispatch preferences, or specific Pantone codes..."
                            />
                        </Field>
                        <div className="rounded-xl bg-muted p-4 text-sm space-y-2">
                            <p className="font-semibold text-ink border-b border-black/10 pb-2">Review Your Request Summary</p>
                            <Row k="Name" v={form.name} />
                            <Row k="Mobile" v={form.phone} />
                            {form.whatsapp && <Row k="WhatsApp" v={form.whatsapp} />}
                            {form.email && <Row k="Email" v={form.email} />}
                            {form.business_name && <Row k="Business" v={form.business_name} />}
                            {form.location && <Row k="Location" v={form.location} />}
                            <Row k="Service" v={form.service || "General Printing"} />
                            {form.product && <Row k="Product" v={form.product} />}
                            {form.variant && <Row k="Variant" v={form.variant} />}
                            {form.material && <Row k="Material" v={form.material} />}
                            {form.size && <Row k="Size" v={form.size} />}
                            {form.finishing && <Row k="Finishing" v={form.finishing} />}
                            {form.quantity && <Row k="Quantity" v={form.quantity} />}
                            {form.expected_date && <Row k="Required By" v={form.expected_date} />}
                            {form.requirement && <Row k="Requirement" v={form.requirement} />}
                            <Row k="Files Attached" v={`${files.length} file(s)`} />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center py-8">
                        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-rk-red/10">
                            <Check className="h-8 w-8 text-rk-red" />
                        </div>
                        <h2 className="mt-5 font-heading font-extrabold text-2xl text-ink">Quotation Request Received!</h2>
                        <p className="mt-2 text-ink-soft">Your inquiry has been logged. Our print team will prepare an itemized quote and contact you shortly.</p>
                        <div className="mt-5 inline-block rounded-xl bg-muted px-6 py-3.5 border border-black/5">
                            <p className="text-xs text-ink-soft uppercase tracking-wider font-semibold">Your Enquiry ID</p>
                            <p className="font-heading font-extrabold text-xl text-rk-red mt-0.5">{leadId}</p>
                        </div>
                        <p className="mt-2.5 text-xs text-ink-soft">Submitted at: {new Date().toLocaleString("en-IN")}</p>
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <a
                                href={waLink(`Hello RK Printers, I just submitted a custom quote request on your website. My Enquiry ID is ${leadId}. Please share pricing.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition"
                            >
                                <MessageCircle className="h-4 w-4" /> Connect on WhatsApp
                            </a>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep(0);
                                    setLeadId(null);
                                    setFiles([]);
                                    setForm({
                                        name: "", phone: "", whatsapp: "", email: "", business_name: "",
                                        service: "", product: "", product_id: "", industry: "", category: "",
                                        variant: "", quality: "", gsm: "", material: "", size: "", finishing: "",
                                        quantity: "", delivery_date: "", additional_requirements: "",
                                        requirement: "",
                                    });
                                }}
                                className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
                            >
                                Submit Another Request
                            </button>
                        </div>
                    </div>
                )}

                {step < 4 && (
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-black/8">
                        <button
                            type="button"
                            onClick={() => setStep(Math.max(0, step - 1))}
                            disabled={step === 0 || saving}
                            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40 hover:bg-muted transition"
                        >
                            Back
                        </button>
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={uploading}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rk-red px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={submit}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit Request
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-ink">{label}</label>
                {error && <span className="text-xs font-semibold text-red-500">{error}</span>}
            </div>
            {children}
        </div>
    );
}

function Row({ k, v }) {
    return (
        <p className="flex justify-between text-xs py-0.5">
            <span className="text-ink-soft">{k}</span>
            <span className="font-medium text-ink">{v}</span>
        </p>
    );
}
