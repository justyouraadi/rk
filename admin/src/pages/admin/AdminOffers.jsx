import React from "react";
import AdminCrud from "@/components/AdminCrud";

export default function AdminOffers() {
    return <AdminCrud config={{
        entity: "Offer", title: "Offers", subtitle: "Promotional deals & discounts",
        columns: [
            { key: "title", label: "Title", render: o => <span className="font-semibold text-ink">{o.title}</span> },
            { key: "discount", label: "Discount", render: o => o.discount ? <span className="text-xs rounded-full bg-rk-red/10 text-rk-red px-2 py-0.5 font-bold">{o.discount}</span> : "—" },
            { key: "starting_price", label: "From" },
            { key: "valid_until", label: "Valid Till" },
            { key: "is_active", label: "Active", render: o => <span className={`text-xs font-bold ${o.is_active ? "text-green-600" : "text-ink-soft"}`}>{o.is_active ? "Yes" : "No"}</span> },
        ],
        formFields: [
            { key: "title", label: "Title", required: true },
            { key: "description", label: "Description", type: "textarea" },
            { key: "discount", label: "Discount (e.g. 20% OFF)" },
            { key: "starting_price", label: "Starting Price (₹)", type: "number" },
            { key: "valid_from", label: "Valid From" },
            { key: "valid_until", label: "Valid Until" },
            { key: "cta_text", label: "CTA Text" },
            { key: "image_url", label: "Image URL" },
            { key: "is_active", label: "Active", type: "boolean" },
        ],
        defaults: { is_active: true, cta_text: "Get a Quote", starting_price: 0 },
    }} />;
}