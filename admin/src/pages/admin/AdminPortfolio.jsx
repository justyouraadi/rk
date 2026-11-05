import React from "react";
import AdminCrud from "@/components/AdminCrud";

const CATS = ["PRINTING", "BRANDING", "PACKAGING", "CORPORATE", "EVENTS", "PROMOTIONAL", "CAMPAIGN"];

export default function AdminPortfolio() {
    return <AdminCrud config={{
        entity: "PortfolioItem", title: "Portfolio", subtitle: "Showcase your work",
        columns: [
            { key: "title", label: "Title", render: p => <span className="font-semibold text-ink">{p.title}</span> },
            { key: "category", label: "Category", render: p => <span className="text-xs rounded-full bg-muted px-2 py-0.5">{p.category}</span> },
            { key: "client", label: "Client" },
            { key: "date", label: "Date" },
        ],
        formFields: [
            { key: "title", label: "Title", required: true },
            { key: "category", label: "Category", type: "select", options: CATS, required: true },
            { key: "client", label: "Client" },
            { key: "date", label: "Date", type: "text" },
            { key: "image_url", label: "Image URL", required: true },
            { key: "description", label: "Description", type: "textarea" },
        ],
        defaults: { category: "PRINTING" },
    }} />;
}