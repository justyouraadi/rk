export const BRAND = {
    name: "RK PRINTERS",
    tagline: "PRINT | BRAND | CREATE",
    positioning: "Your Complete Printing & Branding Partner",
    category: "Printing & Branding Solutions",
    phone1: "7426919797",
    phone2: "7877227753",
    address: "N.H. 8, Flyover, Near Bank of Baroda, Kotputli, Rajasthan – 303108",
    city: "Kotputli",
    state: "Rajasthan",
    pincode: "303108",
    email: "rkprinters.kotputli@gmail.com",
    heroImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
};

export const WHATSAPP_NUMBER = "917426919797";

export function waLink(message = "Hello RK Printers, I would like to enquire about your printing services.") {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function telLink() {
    return `tel:+${BRAND.phone1}`;
}

export const SERVICE_CATEGORIES = [
    { key: "PRINTING", label: "Printing", icon: "Printer", desc: "Visiting cards, posters, brochures, banners, flex & more." },
    { key: "BRANDING", label: "Branding", icon: "Palette", desc: "Corporate identity, signage, retail & event branding." },
    { key: "PACKAGING", label: "Packaging", icon: "Package", desc: "Product boxes, labels, stickers, bags & thank-you cards." },
    { key: "PROMOTIONAL", label: "Promotional", icon: "Sparkles", desc: "T-shirts, caps, flags, gifts & event materials." },
];

export const ORDER_STATUSES = [
    "NEW", "DESIGN_PENDING", "DESIGN_IN_PROGRESS", "DESIGN_APPROVAL", "PRINTING",
    "FINISHING", "QUALITY_CHECK", "PACKING", "READY", "DISPATCHED", "DELIVERED", "COMPLETED"
];

export const LEAD_STATUSES = ["NEW", "CONTACTED", "REQUIREMENT_RECEIVED", "QUOTE_SENT", "FOLLOW_UP", "CONVERTED", "LOST"];

export const LEAD_SOURCES = ["WEBSITE", "INSTAGRAM", "FACEBOOK", "META_ADS", "WHATSAPP", "GOOGLE", "REFERRAL", "WALK_IN"];

export function formatINR(n) {
    if (n == null || isNaN(n)) return "—";
    return "₹" + Number(n).toLocaleString("en-IN");
}

export function genId(prefix = "RK") {
    const t = Date.now().toString().slice(-6);
    const r = Math.floor(Math.random() * 900 + 100);
    return `${prefix}-${t}${r}`;
}