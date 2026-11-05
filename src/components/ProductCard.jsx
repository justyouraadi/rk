import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Printer, Palette, Package, Sparkles, FileText, Star } from "lucide-react";
import { formatINR } from "@/lib/brand";

const CAT_ICONS = {
    PRINTING: Printer,
    BRANDING: Palette,
    PACKAGING: Package,
    PROMOTIONAL: Sparkles,
};

export default function ProductCard({ product, industryId, categoryName }) {
    const Icon = CAT_ICONS[product.category] || FileText;
    const to = `/products/${product.slug || product.id}${industryId ? `?industry=${industryId}` : ""}`;
    const catLabel = categoryName || (product.category || "").replace(/_/g, " ");

    return (
        <Link to={to} className="group rounded-2xl border border-black/8 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white flex flex-col">
            {/* Visual — photo or icon + CMYK accent */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/40 overflow-hidden grid place-items-center">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                    <>
                        <div className="absolute top-0 right-0 h-24 w-24 cmyk-dot rounded-full opacity-[0.05] blur-xl" />
                        <div className="absolute bottom-0 left-0 h-1 w-full cmyk-bar opacity-30" />
                        <Icon className="h-12 w-12 text-ink-soft/25 group-hover:text-rk-red/40 transition-colors" />
                    </>
                )}
                {product.is_featured && (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-rk-red text-white text-[9px] font-bold px-2 py-0.5">
                        <Star className="h-2.5 w-2.5 fill-white" /> FEATURED
                    </span>
                )}
                {(product.variants?.length || 0) > 0 && (
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-white/80 backdrop-blur text-ink-soft text-[9px] font-semibold px-2 py-0.5">
                        {product.variants.length} variants
                    </span>
                )}
            </div>
            <div className="p-4 flex flex-col flex-1">
                <span className="text-[10px] font-semibold tracking-wider text-rk-red uppercase">{catLabel}</span>
                <p className="mt-1 font-heading font-bold text-ink line-clamp-2 leading-snug">{product.name}</p>
                {product.short_description && <p className="mt-1 text-xs text-ink-soft line-clamp-2">{product.short_description}</p>}
                <div className="mt-auto pt-3 flex items-center justify-between">
                    {product.custom_pricing || !product.starting_price ? (
                        <p className="text-sm font-semibold text-rk-red">Custom Quote</p>
                    ) : (
                        <p className="text-sm font-semibold text-ink">From {formatINR(product.starting_price)}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rk-red">View <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" /></span>
                </div>
            </div>
        </Link>
    );
}