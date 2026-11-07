import React, { useState, useMemo } from "react";
import { ArrowRight, Check, ShoppingCart, MessageCircle } from "lucide-react";
import { formatINR, waLink } from "@/lib/brand";
import { useEnquiry } from "@/lib/EnquiryContext";
import { useToast } from "@/components/ui/use-toast";

export default function ProductConfigurator({ product, industryId }) {
    const [selections, setSelections] = useState({});
    const [quantity, setQuantity] = useState("");
    const { addItem } = useEnquiry();
    const { toast } = useToast();

    const options = product.options || [];
    const variants = product.variants || [];
    const quantityOptions = product.quantity_options || [];

    const setOpt = (name, value) => setSelections((s) => ({ ...s, [name]: value }));

    // Build quote params from selections
    const quoteParams = useMemo(() => {
        const p = new URLSearchParams();
        p.set("product", product.name);
        p.set("product_id", product.id);
        if (industryId) p.set("industry", industryId);
        else if ((product.industries || [])[0]) p.set("industry", product.industries[0]);
        p.set("category", product.category || "");
        if (selections.Quality || selections.Variant) p.set("variant", selections.Quality || selections.Variant);
        if (selections.Material) p.set("material", selections.Material);
        if (selections.Size) p.set("size", selections.Size);
        if (selections.Finishing) p.set("finishing", selections.Finishing);
        if (quantity) p.set("quantity", quantity);
        return p;
    }, [selections, quantity, product, industryId]);

    // Dynamic price calculation
    const currentPrice = useMemo(() => {
        if (product.custom_pricing || !product.starting_price) return null;
        let base = Number(product.starting_price);
        if (selections.Variant) {
            const v = variants.find((x) => x.name === selections.Variant);
            if (v && v.price) base = Number(v.price);
        }
        const qNum = parseInt(quantity, 10);
        if (!isNaN(qNum) && qNum > 0) {
            if (product.price_type === "PER_UNIT") {
                return { total: base * qNum, perUnit: base };
            }
            if (Array.isArray(product.price_tiers) && product.price_tiers.length > 0) {
                const tier = product.price_tiers.slice().reverse().find((t) => qNum >= Number(t.quantity));
                if (tier && tier.price) {
                    return { total: Number(tier.price) * qNum, perUnit: Number(tier.price) };
                }
            }
        }
        return { total: base, perUnit: null };
    }, [product, selections.Variant, quantity, variants]);

    const hasOptions = options.length > 0 || variants.length > 0;

    const waMessage = () => {
        const lines = [`Hello RK Printers,`, `I am interested in:`, `Product: ${product.name}`];
        if (selections.Variant || selections.Quality) lines.push(`Variant: ${selections.Variant || selections.Quality}`);
        if (selections.Material) lines.push(`Material: ${selections.Material}`);
        if (selections.Size) lines.push(`Size: ${selections.Size}`);
        if (selections.Finishing) lines.push(`Finishing: ${selections.Finishing}`);
        if (quantity) lines.push(`Quantity: ${quantity}`);
        lines.push(`Please share quotation.`);
        return waLink(lines.join("\n"));
    };

    const addToEnquiry = () => {
        addItem({
            product_id: product.id,
            product_name: product.name,
            variant: selections.Variant || selections.Quality || "",
            material: selections.Material || "",
            size: selections.Size || "",
            finishing: selections.Finishing || "",
            quantity: quantity || "",
        });
        toast({
            title: "Added to Enquiry List",
            description: `${product.name} ${quantity ? `(${quantity} pcs)` : ""} added.`,
        });
    };

    if (!hasOptions && !quantityOptions.length) {
        return (
            <div className="mt-6 flex flex-wrap gap-3">
                <a
                    href={`/get-quote?${quoteParams.toString()}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rk-red/20 hover:opacity-90 transition"
                >
                    Get a Quote <ArrowRight className="h-4 w-4" />
                </a>
                <button
                    onClick={addToEnquiry}
                    className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-muted transition"
                >
                    <ShoppingCart className="h-4 w-4" /> Add to Enquiry
                </button>
                <a
                    href={waMessage()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-muted transition"
                >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
            </div>
        );
    }

    return (
        <div className="mt-6 rounded-2xl border border-black/8 p-5 bg-muted/30">
            {/* Variants */}
            {variants.length > 0 && (
                <div className="mb-5">
                    <p className="text-sm font-semibold text-ink mb-2">Select Quality / Variant</p>
                    <div className="flex flex-wrap gap-2">
                        {variants.map((v) => (
                            <button
                                key={v.name}
                                onClick={() => setOpt("Variant", v.name)}
                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                    selections.Variant === v.name
                                        ? "border-rk-red bg-rk-red text-white"
                                        : "border-black/10 bg-white text-ink hover:border-rk-red/50"
                                }`}
                            >
                                {v.name}
                            </button>
                        ))}
                    </div>
                    {selections.Variant && (() => {
                        const v = variants.find((x) => x.name === selections.Variant);
                        if (!v) return null;
                        return (
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-soft">
                                {v.material && <span>Material: {v.material}</span>}
                                {v.gsm && <span>GSM: {v.gsm}</span>}
                                {v.size && <span>Size: {v.size}</span>}
                                {v.finishing && <span>Finishing: {v.finishing}</span>}
                                {v.production_time && <span>Production: {v.production_time}</span>}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Options (Material, Size, Finishing, etc.) */}
            {options.filter((o) => o.name !== "Quantity").map((opt) => (
                <div key={opt.name} className="mb-4">
                    <p className="text-sm font-semibold text-ink mb-2">Select {opt.name}</p>
                    <div className="flex flex-wrap gap-2">
                        {opt.values.map((val) => (
                            <button
                                key={val}
                                onClick={() => setOpt(opt.name, val)}
                                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                                    selections[opt.name] === val
                                        ? "border-rk-red bg-rk-red text-white"
                                        : "border-black/10 bg-white text-ink hover:border-rk-red/50"
                                }`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Quantity */}
            {quantityOptions.length > 0 && (
                <div className="mb-5">
                    <p className="text-sm font-semibold text-ink mb-2">
                        Select Quantity {product.moq ? `(MOQ: ${product.moq})` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {quantityOptions.map((q) => (
                            <button
                                key={q}
                                onClick={() => setQuantity(q)}
                                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                                    quantity === q
                                        ? "border-rk-red bg-rk-red text-white"
                                        : "border-black/10 bg-white text-ink hover:border-rk-red/50"
                                }`}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Dynamic Price + CTA */}
            <div className="mt-5 pt-5 border-t border-black/8 flex items-center justify-between flex-wrap gap-3">
                <div>
                    {!currentPrice ? (
                        <p className="text-lg font-extrabold text-rk-red">Custom Quote</p>
                    ) : currentPrice.perUnit ? (
                        <div>
                            <p className="text-xl font-extrabold text-rk-red">
                                Est. {formatINR(currentPrice.total)}
                            </p>
                            <p className="text-xs text-ink-soft">
                                ({formatINR(currentPrice.perUnit)} / pc)
                            </p>
                        </div>
                    ) : (
                        <p className="text-lg font-extrabold text-rk-red">
                            From {formatINR(currentPrice.total)}
                        </p>
                    )}
                    {product.production_time && (
                        <p className="text-xs text-ink-soft mt-0.5">Production: {product.production_time}</p>
                    )}
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={addToEnquiry}
                        className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-muted transition"
                    >
                        <ShoppingCart className="h-4 w-4" /> Add to Enquiry
                    </button>
                    <a
                        href={waMessage()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-muted transition"
                    >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                    <a
                        href={`/get-quote?${quoteParams.toString()}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rk-red/20 hover:opacity-90 transition"
                    >
                        Get a Quote <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
