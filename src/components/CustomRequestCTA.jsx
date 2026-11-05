import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb } from "lucide-react";

export default function CustomRequestCTA() {
    return (
        <section className="py-16 lg:py-24">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="rounded-3xl border-2 border-dashed border-black/10 bg-muted/20 p-8 lg:p-14 text-center">
                    <div className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-rk-red/10 text-rk-red">
                        <Lightbulb className="h-7 w-7" />
                    </div>
                    <h2 className="mt-5 font-heading font-extrabold text-2xl sm:text-3xl text-ink">Can't Find What You're Looking For?</h2>
                    <p className="mt-3 text-ink-soft max-w-xl mx-auto">Have a custom printing requirement? Tell us what you need and our team will help you with the right solution.</p>
                    <Link to="/get-quote?custom=1" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-rk-red px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rk-red/20 hover:opacity-90 transition">
                        Request Custom Quote <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}