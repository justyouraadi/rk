import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rk_enquiry_items";

const defaultEnquiryState = {
    items: [],
    addItem: () => {},
    removeItem: () => {},
    clearAll: () => {},
    count: 0,
    open: false,
    setOpen: () => {},
    toggle: () => {},
};

const EnquiryContext = createContext(defaultEnquiryState);

function getInitialItems() {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function EnquiryProvider({ children }) {
    const [items, setItems] = useState(getInitialItems);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            window.dispatchEvent(new CustomEvent("rk_enquiry_changed", { detail: items }));
        } catch { }
    }, [items]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleSync = (e) => {
            if (e?.detail) setItems(e.detail);
            else setItems(getInitialItems());
        };
        const handleToggle = () => setOpen((v) => !v);
        window.addEventListener("rk_enquiry_changed", handleSync);
        window.addEventListener("rk_enquiry_toggle", handleToggle);
        return () => {
            window.removeEventListener("rk_enquiry_changed", handleSync);
            window.removeEventListener("rk_enquiry_toggle", handleToggle);
        };
    }, []);

    const addItem = useCallback((item) => {
        setItems((prev) => {
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
    const toggle = useCallback(() => {
        setOpen((v) => !v);
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("rk_enquiry_toggle"));
        }
    }, []);

    const count = items.length;

    return (
        <EnquiryContext.Provider value={{ items, addItem, removeItem, clearAll, count, open, setOpen, toggle }}>
            {children}
        </EnquiryContext.Provider>
    );
}

export function useEnquiry() {
    const ctx = useContext(EnquiryContext);
    if (!ctx) return defaultEnquiryState;
    return ctx;
}
