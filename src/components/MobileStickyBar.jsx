import React from "react";
import { Link } from "react-router-dom";
import { Phone, MessageCircle, FileText } from "lucide-react";
import { telLink, waLink } from "@/lib/brand";

export default function MobileStickyBar() {
    return (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-3 border-t border-black/10 bg-white/95 backdrop-blur-md">
            <a href={telLink()} className="flex flex-col items-center justify-center py-2.5 text-ink active:bg-black/5">
                <Phone className="h-5 w-5 text-rk-red" />
                <span className="text-[11px] font-semibold mt-0.5">Call</span>
            </a>
            <a href={waLink()} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center py-2.5 text-ink border-x border-black/10 active:bg-black/5">
                <MessageCircle className="h-5 w-5 text-rk-red" />
                <span className="text-[11px] font-semibold mt-0.5">WhatsApp</span>
            </a>
            <Link to="/get-quote" className="flex flex-col items-center justify-center py-2.5 bg-rk-red text-white">
                <FileText className="h-5 w-5" />
                <span className="text-[11px] font-semibold mt-0.5">Get Quote</span>
            </Link>
        </div>
    );
}