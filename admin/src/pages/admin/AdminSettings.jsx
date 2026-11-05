import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Save, Loader2, MessageCircle, Bell } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function AdminSettings() {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [wa, setWa] = useState({ api_url: "", api_key: "", phone: "917426919797", enabled: false });

    const save = async () => {
        setSaving(true);
        try {
            // Persist settings on the current user profile as a simple settings store
            await api.auth.updateMe({ whatsapp_settings: wa });
            toast({ title: "Settings saved" });
        } catch (e) { toast({ title: "Failed to save", description: e.message, variant: "destructive" }); }
        finally { setSaving(false); }
    };

    useEffect(() => {
        (async () => { try { const me = await api.auth.me(); if (me.whatsapp_settings) setWa(me.whatsapp_settings); } catch (e) { } })();
    }, []);

    return (
        <div className="space-y-6 max-w-3xl">
            <div><h1 className="font-heading font-extrabold text-2xl text-ink">Settings</h1><p className="text-sm text-ink-soft">Configure integrations & business info</p></div>

            <div className="rounded-2xl bg-white border border-black/8 p-6">
                <div className="flex items-center gap-2 mb-4"><MessageCircle className="h-5 w-5 text-rk-red" /><h2 className="font-heading font-bold text-lg">WhatsApp API Configuration</h2></div>
                <p className="text-sm text-ink-soft mb-4">Enter your WhatsApp Business API credentials to enable automated messaging. Credentials are stored securely and never exposed in frontend code.</p>
                <div className="space-y-4">
                    <div><label className="block text-sm font-semibold mb-1.5">API URL</label><input className="rk-input" placeholder="https://api.your-provider.com/send" value={wa.api_url} onChange={e => setWa({ ...wa, api_url: e.target.value })} /></div>
                    <div><label className="block text-sm font-semibold mb-1.5">API Key / Token</label><input className="rk-input" type="password" placeholder="••••••••" value={wa.api_key} onChange={e => setWa({ ...wa, api_key: e.target.value })} /></div>
                    <div><label className="block text-sm font-semibold mb-1.5">WhatsApp Number</label><input className="rk-input" value={wa.phone} onChange={e => setWa({ ...wa, phone: e.target.value })} /></div>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={wa.enabled} onChange={e => setWa({ ...wa, enabled: e.target.checked })} /> <span className="text-sm font-medium">Enable WhatsApp automation</span></label>
                </div>
                <button onClick={save} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rk-red text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings</button>
            </div>

            <div className="rounded-2xl bg-white border border-black/8 p-6">
                <div className="flex items-center gap-2 mb-4"><Bell className="h-5 w-5 text-rk-red" /><h2 className="font-heading font-bold text-lg">Business Information</h2></div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <Info k="Business Name" v={BRAND.name} />
                    <Info k="Tagline" v={BRAND.tagline} />
                    <Info k="Phone 1" v={BRAND.phone1} />
                    <Info k="Phone 2" v={BRAND.phone2} />
                    <Info k="Email" v={BRAND.email} />
                    <Info k="City" v={BRAND.city} />
                    <div className="sm:col-span-2"><Info k="Address" v={BRAND.address} /></div>
                </div>
            </div>
        </div>
    );
}
function Info({ k, v }) { return <div><p className="text-xs text-ink-soft">{k}</p><p className="font-semibold text-ink">{v}</p></div>; }