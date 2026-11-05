import React from "react";
import AdminCrud from "@/components/AdminCrud";

const CATS = ["PAPER", "INK", "FLEX", "VINYL", "PACKAGING", "TSHIRT", "CAP", "BAG", "STICKER", "OTHER"];

export default function AdminInventory() {
    return <AdminCrud config={{
        entity: "InventoryItem", title: "Inventory", subtitle: "Stock & material management",
        columns: [
            { key: "name", label: "Item", render: i => <span className="font-semibold text-ink">{i.name}</span> },
            { key: "category", label: "Category", render: i => <span className="text-xs rounded-full bg-muted px-2 py-0.5">{i.category}</span> },
            {
                key: "current_stock", label: "Stock", render: i => {
                    const low = i.current_stock <= (i.minimum_stock || 0);
                    return <span className={low ? "text-red-600 font-bold" : "text-ink"}>{i.current_stock} {i.unit || ""}</span>;
                }
            },
            { key: "minimum_stock", label: "Min" },
            { key: "supplier", label: "Supplier" },
            { key: "purchase_cost", label: "Cost" },
        ],
        formFields: [
            { key: "name", label: "Item Name", required: true },
            { key: "category", label: "Category", type: "select", options: CATS, required: true },
            { key: "current_stock", label: "Current Stock", type: "number", required: true },
            { key: "minimum_stock", label: "Minimum Stock", type: "number" },
            { key: "unit", label: "Unit (pcs, kg, sheet)" },
            { key: "supplier", label: "Supplier" },
            { key: "purchase_cost", label: "Purchase Cost (₹)", type: "number" },
        ],
        defaults: { category: "PAPER", current_stock: 0, minimum_stock: 0, unit: "pcs", purchase_cost: 0 },
    }} />;
}