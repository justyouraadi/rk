import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const EnquiryContext = createContext(null);
const STORAGE_KEY = "rk_enquiry_items";

export function EnquiryProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch { }
    }, [items]);

    const addItem = useCallback((item) => {
        setItems((prev) => {
            // Dedupe by product_id + variant + size; merge quantity if same
            const idx = prev.findIndex(
                (x) => x.product_id === item.product_id && x.variant === item.variant && x.size === item.size && x.material === item.material
            );
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: item.quantity || next[idx].quantity };
                return next;
            }
            return [...prev, item];
        });
        setOpen(true);
    }, []);

    const removeItem = useCallback((index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const clearAll = useCallback(() => setItems([]), []);
    const toggle = useCallback(() => setOpen((v) => !v), []);

    const count = items.length;

    return (
        <EnquiryContext.Provider value={{ items, addItem, removeItem, clearAll, count, open, setOpen, toggle }}>
            {children}
        </EnquiryContext.Provider>
    );
}

export function useEnquiry() {
    const ctx = useContext(EnquiryContext);
    if (!ctx) throw new Error("useEnquiry must be used within EnquiryProvider");
    return ctx;
}