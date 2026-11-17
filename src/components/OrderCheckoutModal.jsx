import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, CreditCard, ShieldCheck, Package, Lock, LogIn, UserCheck } from "lucide-react";
import { api } from "@/api/apiClient";
import { formatINR } from "@/lib/brand";

function loadPaymentGateway() {
    return new Promise((resolve) => {
        if (typeof window !== "undefined" && window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function OrderCheckoutModal({
    open,
    onClose,
    product,
    selections = {},
    quantity = 1,
    calculatedPrice = null,
    cartItems = null,
}) {
    if (!open) return null;

    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("form"); // 'form' | 'processing' | 'verifying' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState("");
    const [createdOrder, setCreatedOrder] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [idempotencyKey, setIdempotencyKey] = useState("");

    // Check auth status & prefill details if logged in
    useEffect(() => {
        const checkAuth = async () => {
            setAuthLoading(true);
            try {
                const token = api.auth.getToken();
                if (!token) {
                    setIsLoggedIn(false);
                    setUser(null);
                    return;
                }

                // Check stored user or query profile
                let currentUser = null;
                const cached = typeof window !== "undefined" ? localStorage.getItem("rk_user") : null;
                if (cached) {
                    try { currentUser = JSON.parse(cached); } catch {}
                }

                if (!currentUser) {
                    currentUser = await api.auth.me();
                }

                if (currentUser && (currentUser.id || currentUser.email || currentUser.phone)) {
                    setIsLoggedIn(true);
                    setUser(currentUser);
                    setName(currentUser.full_name || currentUser.name || "");
                    setPhone(currentUser.phone || "");
                    setEmail(currentUser.email || "");
                    if (currentUser.address) setAddress(currentUser.address);
                } else {
                    setIsLoggedIn(false);
                    setUser(null);
                }
            } catch (err) {
                console.warn("Auth check failed:", err);
                setIsLoggedIn(false);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, [open]);

    // Initialize fresh idempotency key when opening
    useEffect(() => {
        const key = `rk-order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setIdempotencyKey(key);
    }, [open]);

    // Calculate line items and total amount
    const items = cartItems && cartItems.length > 0
        ? cartItems.map((c) => ({
            name: c.product_name,
            quantity: parseInt(c.quantity, 10) || 1,
            rate: c.rate || 0,
            amount: c.amount || 0,
            specifications: [c.variant, c.size, c.material, c.finishing].filter(Boolean).join(" • "),
        }))
        : [
            {
                name: product?.name || "Custom Print Product",
                quantity: parseInt(quantity, 10) || 1,
                rate: calculatedPrice?.perUnit || calculatedPrice?.total || Number(product?.starting_price || 0),
                amount: calculatedPrice?.total || Number(product?.starting_price || 0) * (parseInt(quantity, 10) || 1),
                specifications: Object.entries(selections)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" • "),
            },
        ];

    const totalAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0) || (calculatedPrice?.total || 500);

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!isLoggedIn) {
            setErrorMsg("Please log in to your account to place an order.");
            return;
        }

        if (!name.trim()) {
            setErrorMsg("Please enter your full name");
            return;
        }
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length < 10) {
            setErrorMsg("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);
        setStatus("processing");

        try {
            const scriptLoaded = await loadPaymentGateway();
            if (!scriptLoaded) {
                throw new Error("Payment gateway failed to load. Please check your internet connection.");
            }

            // 1. Create payment order with Idempotency Key
            const payload = {
                user_id: user?.id,
                customer_name: name.trim(),
                customer_phone: cleanPhone,
                customer_email: email.trim() || undefined,
                shipping_address: address.trim() || undefined,
                items,
                total_amount: totalAmount,
                notes: notes.trim() || undefined,
            };

            const orderResponse = await api.payments.createRazorpayOrder(payload, idempotencyKey);
            const { order, razorpay_order, razorpay_key_id } = orderResponse;
            setCreatedOrder(order);

            // 2. Open Payment Checkout
            const options = {
                key: razorpay_key_id || "rzp_test_TwTVCh5sO3eGIT",
                amount: razorpay_order.amount,
                currency: razorpay_order.currency || "INR",
                name: "RK Printers",
                description: `Payment for Order #${order.order_number}`,
                order_id: razorpay_order.id,
                prefill: {
                    name: name.trim(),
                    contact: cleanPhone,
                    email: email.trim(),
                },
                theme: {
                    color: "#e11d48", // RK Red brand color
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setStatus("form");
                    },
                },
                handler: async (resp) => {
                    // 3. Payment verification
                    setStatus("verifying");
                    try {
                        const verifyPayload = {
                            razorpay_order_id: resp.razorpay_order_id,
                            razorpay_payment_id: resp.razorpay_payment_id,
                            razorpay_signature: resp.razorpay_signature,
                            order_id: order.id,
                            order_number: order.order_number,
                            user_id: user?.id,
                        };

                        const verifyKey = `verify-${resp.razorpay_payment_id}-${idempotencyKey}`;
                        const verifyResult = await api.payments.verifyRazorpayPayment(verifyPayload, verifyKey);

                        setPaymentDetails(resp);
                        setCreatedOrder(verifyResult.order || order);
                        setStatus("success");
                    } catch (verifyErr) {
                        console.error("Payment verification failed:", verifyErr);
                        setErrorMsg(verifyErr.message || "Payment verification failed. Please contact RK Printers support with your payment reference.");
                        setStatus("error");
                    } finally {
                        setLoading(false);
                    }
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (failResp) => {
                console.error("Payment failed:", failResp.error);
                setErrorMsg(failResp.error.description || "Payment was cancelled or unsuccessful. Please try again.");
                setStatus("form");
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            console.error("Order checkout error:", err);
            setErrorMsg(err.message || "Failed to initialize checkout.");
            setStatus("form");
            setLoading(false);
        }
    };

    const returnUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={status !== "processing" && status !== "verifying" ? onClose : undefined} />

            {/* Modal Container */}
            <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-ink text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-rk-red text-white">
                            <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-base text-white">Checkout & Order Online</h3>
                            <p className="text-xs text-white/60">Verified production & tracking workflow</p>
                        </div>
                    </div>
                    {status !== "processing" && status !== "verifying" && (
                        <button onClick={onClose} className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition">
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                            <div className="flex-1">
                                <p className="font-semibold">Notice</p>
                                <p>{errorMsg}</p>
                            </div>
                        </div>
                    )}

                    {/* Authentication Loading */}
                    {authLoading ? (
                        <div className="py-12 text-center space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-rk-red mx-auto" />
                            <p className="text-xs text-ink-soft">Checking account authentication...</p>
                        </div>
                    ) : !isLoggedIn ? (
                        /* Login Required Gate */
                        <div className="py-6 text-center space-y-4">
                            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rk-red/10 text-rk-red">
                                <Lock className="h-8 w-8 text-rk-red" />
                            </div>
                            <div>
                                <h3 className="font-heading font-extrabold text-xl text-ink">
                                    Login Required to Place Order
                                </h3>
                                <p className="text-xs text-ink-soft mt-1.5 max-w-sm mx-auto leading-relaxed">
                                    Only registered customers can place print orders. Signing in saves your order to your account, enables live tracking, and provides downloadable tax invoices.
                                </p>
                            </div>

                            {/* Summary Preview */}
                            <div className="rounded-xl border border-black/8 bg-muted/20 p-3 text-xs text-left max-w-sm mx-auto space-y-1">
                                <p className="font-semibold text-ink">Order Summary:</p>
                                <p className="text-ink-soft">{items.map((it) => `${it.name} (Qty: ${it.quantity})`).join(", ")}</p>
                                <p className="font-bold text-rk-red pt-1 border-t border-black/5 flex justify-between">
                                    <span>Total:</span>
                                    <span>{formatINR(totalAmount)}</span>
                                </p>
                            </div>

                            <div className="pt-2 flex flex-col gap-2.5 max-w-sm mx-auto">
                                <a
                                    href={`/login?returnTo=${returnUrl}`}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rk-red text-white py-3 text-sm font-semibold hover:opacity-90 transition shadow-md shadow-rk-red/20"
                                >
                                    <LogIn className="h-4 w-4" /> Log In to Place Order
                                </a>
                                <a
                                    href={`/register?returnTo=${returnUrl}`}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 bg-white text-ink py-2.5 text-sm font-semibold hover:bg-muted transition"
                                >
                                    Create New Account
                                </a>
                            </div>
                        </div>
                    ) : status === "success" ? (
                        /* Success State */
                        <div className="py-6 text-center space-y-4">
                            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </div>
                            <div>
                                <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 mb-2">
                                    Payment Successful
                                </span>
                                <h3 className="font-heading font-extrabold text-2xl text-ink">
                                    Order Placed Successfully!
                                </h3>
                                <p className="text-xs text-ink-soft mt-1">
                                    Order Number: <strong className="text-ink font-mono text-sm">{createdOrder?.order_number}</strong>
                                </p>
                            </div>

                            <div className="rounded-xl border border-black/8 bg-muted/30 p-4 text-left text-xs space-y-2">
                                <div className="flex justify-between py-1 border-b border-black/5">
                                    <span className="text-ink-soft">Amount Paid:</span>
                                    <strong className="text-ink">{formatINR(createdOrder?.total_amount || totalAmount)}</strong>
                                </div>
                                <div className="flex justify-between py-1 border-b border-black/5">
                                    <span className="text-ink-soft">Payment Method:</span>
                                    <strong className="text-emerald-700">Prepaid Online</strong>
                                </div>
                                {paymentDetails?.razorpay_payment_id && (
                                    <div className="flex justify-between py-1 border-b border-black/5">
                                        <span className="text-ink-soft">Transaction Reference:</span>
                                        <span className="font-mono text-ink-soft">{paymentDetails.razorpay_payment_id}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-1">
                                    <span className="text-ink-soft">Current Stage:</span>
                                    <strong className="text-amber-700">Awaiting Admin Approval</strong>
                                </div>
                            </div>

                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 text-left">
                                <p className="font-semibold flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                                    Next Step: Admin Approval
                                </p>
                                <p className="mt-0.5 text-amber-700">
                                    Our production manager will verify your job specifications, confirm artwork, and formally approve the order into the press queue. You will receive progress updates by email and SMS/WhatsApp.
                                </p>
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <a
                                    href={`/track-order?orderId=${createdOrder?.order_number}`}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red text-white py-3 text-sm font-semibold hover:opacity-90 transition shadow-sm"
                                >
                                    <Package className="h-4 w-4" /> Track Order Status
                                </a>
                                <button
                                    onClick={onClose}
                                    className="inline-flex items-center justify-center rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-muted transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : status === "verifying" ? (
                        <div className="py-12 text-center space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-rk-red mx-auto" />
                            <div>
                                <h4 className="font-heading font-bold text-lg text-ink">Verifying Payment...</h4>
                                <p className="text-xs text-ink-soft mt-1">Please do not close or refresh this window.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitOrder} className="space-y-4">
                            {/* Logged in User Bar */}
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-ink">
                                            Ordering as: <span className="text-emerald-800">{user?.full_name || user?.name || "Verified Customer"}</span>
                                        </p>
                                        <p className="text-[11px] text-ink-soft">{user?.email || user?.phone}</p>
                                    </div>
                                </div>
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                    Logged In
                                </span>
                            </div>

                            {/* Summary Card */}
                            <div className="rounded-xl border border-black/8 bg-muted/20 p-3.5 space-y-2">
                                <p className="text-xs font-bold text-ink uppercase tracking-wider">Item Details</p>
                                {items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-xs">
                                        <div>
                                            <p className="font-semibold text-ink">{it.name}</p>
                                            {it.specifications && <p className="text-ink-soft text-[11px]">{it.specifications}</p>}
                                            <p className="text-ink-soft text-[11px]">Qty: {it.quantity}</p>
                                        </div>
                                        <p className="font-bold text-ink">{formatINR(it.amount)}</p>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-black/6 flex justify-between items-center text-sm">
                                    <span className="font-bold text-ink">Total Payable</span>
                                    <span className="font-extrabold text-rk-red text-base">{formatINR(totalAmount)}</span>
                                </div>
                            </div>

                            {/* Customer Fields */}
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="block text-xs font-semibold text-ink mb-1">
                                        Full Name <span className="text-rk-red">*</span>
                                    </label>
                                    <input
                                        className="rk-input text-sm py-2"
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-ink mb-1">
                                            Mobile Number <span className="text-rk-red">*</span>
                                        </label>
                                        <input
                                            className="rk-input text-sm py-2"
                                            placeholder="10-digit number"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-ink mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            className="rk-input text-sm py-2"
                                            placeholder="For order receipt & updates"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-ink mb-1">
                                        Delivery / Shipping Address <span className="text-rk-red">*</span>
                                    </label>
                                    <textarea
                                        className="rk-input text-sm py-2 resize-none"
                                        rows={2}
                                        placeholder="Street, area, city, pincode"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-ink mb-1">
                                        Special Instructions / Design Notes (Optional)
                                    </label>
                                    <input
                                        className="rk-input text-sm py-2"
                                        placeholder="e.g. Will provide logo via WhatsApp, urgent requirement"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Security & Guarantee note */}
                            <div className="flex items-center gap-2 text-[11px] text-ink-soft pt-1">
                                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>100% Secure & Encrypted Payment. Orders are verified before production.</span>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rk-red py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-rk-red/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Connecting to secure payment gateway...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-4 w-4" />
                                        Pay {formatINR(totalAmount)} Securely
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
