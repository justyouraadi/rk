import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Phone, Mail, MessageCircle, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { BRAND, waLink, telLink } from "@/lib/brand";

export default function Contact() {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [submittedId, setSubmittedId] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

    const submit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSaving(true);
        const refId = `CN-${Date.now().toString().slice(-6)}`;

        try {
            await api.entities.Lead.create({
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || null,
                requirement: `[Contact Form Message]: ${form.message.trim()}`,
                service: "INQUIRY",
                source: "CONTACT_FORM",
                status: "NEW",
                lead_id: refId,
            });

            await api.entities.Notification.create({
                title: "New Contact Message",
                message: `${form.name.trim()} (${form.phone.trim()}) sent a contact message: ${form.message.trim().slice(0, 80)}...`,
                type: "LEAD",
                audience: "ADMIN",
            }).catch(() => { });

            setSubmittedId(refId);
            toast({
                title: "Message Sent Successfully!",
                description: `Your enquiry reference is ${refId}. Our team will respond shortly.`,
            });
        } catch (err) {
            console.error("Contact submission error:", err);
            setErrorMsg(err.message || "Failed to send your message. Please try again or WhatsApp us directly.");
            toast({
                title: "Could not send message",
                description: err.message || "Please check your network and try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red uppercase">CONTACT</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Get in Touch</h1>
                    <p className="mt-4 text-white/60 max-w-2xl mx-auto">We're here to help with all your printing, packaging & branding requirements.</p>
                </div>
            </section>

            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-black/8 p-6 flex gap-4">
                            <MapPin className="h-6 w-6 text-rk-red shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-ink">Main Printing Facility</p>
                                <p className="text-sm text-ink-soft mt-1 leading-relaxed">{BRAND.address}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/8 p-6 flex gap-4">
                            <Phone className="h-6 w-6 text-rk-red shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-ink">Call Our Support Desk</p>
                                <a href={telLink()} className="text-sm text-ink hover:text-rk-red font-medium mt-1 block transition">{BRAND.phone1}</a>
                                <a href={`tel:+91${BRAND.phone2}`} className="text-sm text-ink hover:text-rk-red font-medium block transition">{BRAND.phone2}</a>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-black/8 p-6 flex gap-4">
                            <Mail className="h-6 w-6 text-rk-red shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-ink">Official Email</p>
                                <a href={`mailto:${BRAND.email}`} className="text-sm text-ink hover:text-rk-red font-medium mt-1 block transition">{BRAND.email}</a>
                            </div>
                        </div>

                        <a href={waLink("Hello RK Printers, I would like to enquire about your printing services.")} target="_blank" rel="noreferrer" className="rounded-2xl bg-ink text-white p-6 flex items-center gap-4 hover:bg-black/90 transition">
                            <MessageCircle className="h-6 w-6 text-rk-red shrink-0" />
                            <div>
                                <p className="font-semibold">Chat on WhatsApp</p>
                                <p className="text-sm text-white/60">Fastest way to get quotes & share design files</p>
                            </div>
                        </a>

                        <div className="rounded-2xl overflow-hidden border border-black/8 min-h-[260px] relative shadow-sm">
                            <iframe
                                title="RK Printers Kotputli Location"
                                className="w-full h-full min-h-[260px] border-0"
                                loading="lazy"
                                allowFullScreen
                                src="https://maps.google.com/maps?q=RK+Printers+Kotputli+N.H.+8+Flyover+Near+Bank+of+Baroda+Rajasthan+303108&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-black/8 p-8 bg-white shadow-sm flex flex-col justify-center">
                        {submittedId ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-green-50 text-green-600">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h2 className="font-heading font-extrabold text-2xl text-ink">Thank You, {form.name}!</h2>
                                <p className="text-sm text-ink-soft max-w-md mx-auto">
                                    Your message has been received. Our team will review your requirement and call/WhatsApp you within 2–4 hours.
                                </p>
                                <div className="inline-block rounded-xl bg-muted px-5 py-3 border border-black/5">
                                    <p className="text-xs text-ink-soft uppercase tracking-wider font-semibold">Enquiry Reference ID</p>
                                    <p className="font-heading font-extrabold text-lg text-rk-red">{submittedId}</p>
                                </div>
                                <div className="pt-4 flex flex-wrap justify-center gap-3">
                                    <a
                                        href={waLink(`Hello RK Printers, I just sent a message on your website. My enquiry reference is ${submittedId}.`)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] px-5 py-2.5 text-sm font-semibold text-white transition"
                                    >
                                        <MessageCircle className="h-4 w-4" /> Message on WhatsApp
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSubmittedId(null);
                                            setForm({ name: "", phone: "", email: "", message: "" });
                                        }}
                                        className="rounded-lg border border-black/10 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-muted transition"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <h2 className="font-heading font-bold text-2xl text-ink">Send a Message</h2>
                                    <p className="text-sm text-ink-soft mt-1">Have a custom question or project requirement? Let us know.</p>
                                </div>

                                {errorMsg && (
                                    <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-ink">Full Name *</label>
                                    <input
                                        required
                                        className="rk-input"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Your full name"
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-ink">Mobile Number *</label>
                                        <input
                                            required
                                            type="tel"
                                            className="rk-input"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="10-digit phone number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 text-ink">Email Address</label>
                                        <input
                                            type="email"
                                            className="rk-input"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-ink">Requirement or Message *</label>
                                    <textarea
                                        required
                                        className="rk-input min-h-[130px]"
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="Tell us what you need printed, approximate quantity, or any questions..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red px-7 py-3.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition w-full sm:w-auto"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
