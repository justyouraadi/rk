import React from "react";
import { BRAND } from "@/lib/brand";

export default function Privacy() {
    return <LegalPage title="Privacy Policy" body={privacyBody()} />;
}
export function Terms() {
    return <LegalPage title="Terms & Conditions" body={termsBody()} />;
}

function LegalPage({ title, body }) {
    return (
        <div>
            <section className="bg-ink text-white py-14"><div className="mx-auto max-w-4xl px-4 sm:px-6"><h1 className="font-heading font-extrabold text-3xl">{title}</h1></div></section>
            <section className="py-12 lg:py-16"><div className="mx-auto max-w-4xl px-4 sm:px-6 prose prose-sm text-ink-soft space-y-4">{body}</div></section>
        </div>
    );
}

function privacyBody() {
    return (<>
        <p>At {BRAND.name}, we respect your privacy. This policy explains how we collect, use and protect your information when you use our website and services.</p>
        <h3 className="font-heading font-bold text-ink mt-6">Information We Collect</h3>
        <p>We collect information you provide directly — such as your name, phone number, email and business details — when you submit a quote request, contact us, or create an account.</p>
        <h3 className="font-heading font-bold text-ink mt-6">How We Use It</h3>
        <p>We use your information to respond to enquiries, prepare quotations, process orders, and communicate about your projects. We never sell your data to third parties.</p>
        <h3 className="font-heading font-bold text-ink mt-6">Data Security</h3>
        <p>We implement appropriate security measures to protect your information. Files you upload are stored privately and access is restricted.</p>
        <h3 className="font-heading font-bold text-ink mt-6">Contact</h3>
        <p>For privacy questions, reach us at {BRAND.email} or {BRAND.phone1}.</p>
    </>);
}
function termsBody() {
    return (<>
        <p>These terms govern your use of {BRAND.name} services and website.</p>
        <h3 className="font-heading font-bold text-ink mt-6">Orders & Quotations</h3>
        <p>All quotations are valid for the period stated on the quote. Prices are subject to change for new orders. Orders are confirmed only after advance payment where applicable.</p>
        <h3 className="font-heading font-bold text-ink mt-6">Designs & Files</h3>
        <p>You are responsible for ensuring you have the rights to any artwork or files you provide. We are not liable for copyright infringement in customer-supplied designs.</p>
        <h3 className="font-heading font-bold text-ink mt-6">Delivery</h3>
        <p>Turnaround times are estimates. We are not liable for delays beyond our control. Final delivery is confirmed once the order status is marked Delivered.</p>
        <h3 className="font-heading font-bold text-ink mt-6">Payments</h3>
        <p>Payments can be made via UPI, bank transfer, cash or online. Invoices are generated for every order and are due as per agreed terms.</p>
    </>);
}