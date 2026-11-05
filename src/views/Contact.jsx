import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Phone, Mail, MessageCircle, Send, Loader2 } from "lucide-react";
import { BRAND, waLink, telLink } from "@/lib/brand";

export default function Contact() {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", message: "" });

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.entities.Lead.create({
                name: form.name, phone: form.phone, requirement: form.message,
                source: "WEBSITE", status: "NEW", lead_id: `CN-${Date.now().toString().slice(-6)}`,
            });
            await api.entities.Notification.create({ title: "New Contact Message", message: `${form.name} sent a message.`, type: "MESSAGE", audience: "ADMIN" }).catch(() => { });
            toast({ title: "Message sent", description: "We'll get back to you shortly." });
            setForm({ name: "", phone: "", message: "" });
        } catch (e) { toast({ title: "Could not send", description: e.message, variant: "destructive" }); }
        finally { setSaving(false); }
    };

    return (
        <div>
            <section className="bg-ink text-white py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
                    <span className="text-xs font-semibold tracking-[0.2em] text-rk-red">CONTACT</span>
                    <h1 className="mt-3 font-heading font-extrabold text-4xl sm:text-5xl">Get in Touch</h1>
                    <p className="mt-4 text-white/60 max-w-2xl mx-auto">We're here to help with all your printing & branding needs.</p>
                </div>
            </section>
            <section className="py-12 lg:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-black/8 p-6 flex gap-4"><MapPin className="h-6 w-6 text-rk-red shrink-0" /><div><p className="font-semibold text-ink">Address</p><p className="text-sm text-ink-soft mt-1">{BRAND.address}</p></div></div>
                        <div className="rounded-2xl border border-black/8 p-6 flex gap-4"><Phone className="h-6 w-6 text-rk-red shrink-0" /><div><p className="font-semibold text-ink">Phone</p><a href={telLink()} className="text-sm text-ink-soft mt-1 block">{BRAND.phone1}</a><a href="tel:+917877227753" className="text-sm text-ink-soft block">{BRAND.phone2}</a></div></div>
                        <div className="rounded-2xl border border-black/8 p-6 flex gap-4"><Mail className="h-6 w-6 text-rk-red shrink-0" /><div><p className="font-semibold text-ink">Email</p><p className="text-sm text-ink-soft mt-1">{BRAND.email}</p></div></div>
                        <a href={waLink()} target="_blank" rel="noreferrer" className="rounded-2xl bg-ink text-white p-6 flex items-center gap-4 hover:opacity-90 transition"><MessageCircle className="h-6 w-6 text-rk-red" /><div><p className="font-semibold">Chat on WhatsApp</p><p className="text-sm text-white/60">Fastest way to reach us</p></div></a>
                        <div className="rounded-2xl overflow-hidden border border-black/8 min-h-[240px]"><iframe title="map" className="w-full h-full min-h-[240px]" loading="lazy" src="https://www.google.com/maps?q=Kotputli,Rajasthan,303108&output=embed" /></div>
                    </div>
                    <form onSubmit={submit} className="rounded-2xl border border-black/8 p-8 space-y-4">
                        <h2 className="font-heading font-bold text-xl">Send a Message</h2>
                        <div><label className="block text-sm font-semibold mb-1.5">Name</label><input required className="rk-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div><label className="block text-sm font-semibold mb-1.5">Phone</label><input required className="rk-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                        <div><label className="block text-sm font-semibold mb-1.5">Message</label><textarea required className="rk-input min-h-[120px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
                        <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Message</button>
                    </form>
                </div>
            </section>
        </div>
    );
}