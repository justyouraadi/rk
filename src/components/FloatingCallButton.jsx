import React from "react";
import { Phone } from "lucide-react";
import { telLink, BRAND } from "@/lib/brand";

export default function FloatingCallButton() {
    return (
        <a
            href={telLink()}
            className="fixed bottom-20 lg:bottom-6 right-5 lg:right-6 z-40 group flex items-center gap-2.5 rounded-full bg-rk-red text-white p-3.5 sm:px-4 sm:py-3.5 shadow-xl shadow-rk-red/30 hover:bg-rk-red/90 hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label={`Call ${BRAND.name}`}
            title={`Call ${BRAND.phone1}`}
        >
            <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
                <Phone className="relative h-5 w-5 fill-current" />
            </span>
            <span className="hidden sm:inline-block font-heading font-bold text-xs tracking-wide uppercase pr-1">
                Call Us
            </span>
        </a>
    );
}

