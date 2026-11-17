import crypto from "crypto";
import { prisma, razorpay, ServerConfig } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";
import EmailService from "./email.service.js";

function normalizePaymentOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
    payment_number: item.payment_number || item.payment_id || item.id,
    payment_id: item.payment_id || item.payment_number || item.id,
    method: item.method || item.payment_method || "UPI",
    payment_method: item.payment_method || item.method || "UPI",
    note: item.note || item.notes || "",
    notes: item.notes || item.note || "",
  };
}

class PaymentService {
  async createPayment(params) {
    try {
      if (params.amount === undefined || params.amount === null) {
        throw new AppError(["Payment amount is required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      const pNum = data.payment_number || data.payment_id || `PAY-${Date.now()}`;
      data.payment_number = pNum;
      data.payment_id = pNum;

      data.amount = Number(data.amount);

      if (data.method && !data.payment_method) {
        data.payment_method = data.method;
      }
      if (data.note && !data.notes) {
        data.notes = data.note;
      }

      const payment = await prisma.payment.create({ data });

      // If associated with an order, optionally recalculate paid/pending on the order
      if (payment.order_id) {
        try {
          const order = await prisma.order.findUnique({ where: { id: payment.order_id } });
          if (order) {
            const newPaid = Number(order.paid_amount || 0) + Number(payment.amount);
            const newPending = Math.max(0, Number(order.total_amount) - newPaid);
            const payment_status = newPending === 0 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : "PENDING";
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paid_amount: newPaid,
                pending_amount: newPending,
                payment_status,
              },
            });
          }
        } catch (e) {
          console.warn("Could not auto-update order payment status:", e.message);
        }
      }

      return normalizePaymentOutput(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      handlePrismaError(error);
    }
  }

  async getAllPayments(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", order_id, customer_id, status, search } = query;
      const where = {};

      if (order_id) where.order_id = order_id;
      if (customer_id) where.customer_id = customer_id;
      if (query.customer_name) where.customer_name = { contains: String(query.customer_name) };
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { payment_number: { contains: search } },
          { payment_id: { contains: search } },
          { customer_name: { contains: search } },
          { order_number: { contains: search } },
          { transaction_ref: { contains: search } },
        ];
      }

      const orderBy = {};
      const actualSortBy = sortBy || (sort && sort.replace(/^-/, "")) || "createdAt";
      const actualSortOrder = sortOrder || (sort && sort.startsWith("-") ? "desc" : "asc") || "desc";
      orderBy[actualSortBy] = actualSortOrder;

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [items, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        prisma.payment.count({ where }),
      ]);

      return {
        items: items.map(normalizePaymentOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error retrieving payments:", error);
      handlePrismaError(error);
    }
  }

  async getPaymentById(id) {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [{ id }, { payment_id: id }, { payment_number: id }],
        },
      });
      if (!payment) {
        throw new AppError(["Payment not found"], StatusCodes.NOT_FOUND);
      }
      return normalizePaymentOutput(payment);
    } catch (error) {
      console.error("Error retrieving payment:", error);
      handlePrismaError(error);
    }
  }

  async updatePayment(id, params) {
    try {
      const existing = await prisma.payment.findFirst({
        where: { OR: [{ id }, { payment_id: id }, { payment_number: id }] },
      });
      if (!existing) {
        throw new AppError(["Payment not found"], StatusCodes.NOT_FOUND);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.amount !== undefined) data.amount = Number(data.amount);
      if (data.method && !data.payment_method) data.payment_method = data.method;
      if (data.note && !data.notes) data.notes = data.note;

      const updated = await prisma.payment.update({
        where: { id: existing.id },
        data,
      });
      return normalizePaymentOutput(updated);
    } catch (error) {
      console.error("Error updating payment:", error);
      handlePrismaError(error);
    }
  }

  async deletePayment(id) {
    try {
      const existing = await prisma.payment.findFirst({
        where: { OR: [{ id }, { payment_id: id }, { payment_number: id }] },
      });
      if (!existing) {
        throw new AppError(["Payment not found"], StatusCodes.NOT_FOUND);
      }

      await prisma.payment.delete({ where: { id: existing.id } });
      return { id: existing.id };
    } catch (error) {
      console.error("Error deleting payment:", error);
      handlePrismaError(error);
    }
  }

  /**
   * Create Razorpay Order
   * Accepts either an existing order_id or complete order parameters to initialize checkout.
   */
  async createRazorpayOrder(params = {}) {
    try {
      let order = null;
      let totalAmount = 0;

      if (params.order_id) {
        order = await prisma.order.findFirst({
          where: { OR: [{ id: params.order_id }, { order_number: params.order_id }] },
        });
        if (!order) {
          throw new AppError(["Order not found"], StatusCodes.NOT_FOUND);
        }
        totalAmount = Number(order.pending_amount || order.total_amount);
      } else {
        // Direct order creation with checkout
        if (!params.customer_name || !params.customer_phone) {
          throw new AppError(["Customer name and phone are required for checkout"], StatusCodes.BAD_REQUEST);
        }
        totalAmount = Number(params.total_amount || params.amount || 0);
        if (totalAmount <= 0) {
          throw new AppError(["Total amount must be greater than 0"], StatusCodes.BAD_REQUEST);
        }

        const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        const initialHistory = [
          {
            status: "PLACED",
            label: "Order Placed",
            timestamp: new Date().toISOString(),
            note: "Order placed online, awaiting payment confirmation & admin approval",
          },
        ];

        order = await prisma.order.create({
          data: {
            order_number: orderNumber,
            user_id: params.user_id || null,
            customer_name: params.customer_name,
            customer_phone: params.customer_phone,
            customer_email: params.customer_email || null,
            shipping_address: params.shipping_address || null,
            items: params.items || [],
            total_amount: totalAmount,
            paid_amount: 0,
            pending_amount: totalAmount,
            payment_status: "PENDING",
            order_status: "PLACED",
            status: "PLACED",
            priority: params.priority || "MEDIUM",
            notes: params.notes || null,
            status_history: initialHistory,
          },
        });
      }

      // Amount in paise for Razorpay
      const amountInPaise = Math.round(totalAmount * 100);

      const rzpOptions = {
        amount: amountInPaise,
        currency: params.currency || "INR",
        receipt: order.order_number,
        notes: {
          order_id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone || "",
        },
      };

      const rzpOrder = await razorpay.orders.create(rzpOptions);

      // Record Razorpay Order ID in order notes or tracking
      const updatedNotes = order.notes
        ? `${order.notes} | Razorpay Order: ${rzpOrder.id}`
        : `Razorpay Order: ${rzpOrder.id}`;

      await prisma.order.update({
        where: { id: order.id },
        data: { notes: updatedNotes },
      });

      return {
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          shipping_address: order.shipping_address,
          total_amount: order.total_amount,
          order_status: order.order_status,
          payment_status: order.payment_status,
        },
        razorpay_order: {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          receipt: rzpOrder.receipt,
        },
        razorpay_key_id: ServerConfig.Razorpay.KEY_ID,
      };
    } catch (error) {
      console.error("[PaymentService] Error creating Razorpay order:", error);
      handlePrismaError(error);
    }
  }

  /**
   * Verify Razorpay Payment Signature and finalize order
   */
  async verifyRazorpayPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    order_id,
    order_number,
  }) {
    try {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError(
          ["Missing required Razorpay payment credentials for verification"],
          StatusCodes.BAD_REQUEST
        );
      }

      // 1. Verify signature using HMAC SHA256
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", ServerConfig.Razorpay.KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        throw new AppError(["Invalid Razorpay signature. Verification failed."], StatusCodes.BAD_REQUEST);
      }

      // 2. Locate the Order
      const lookupCriteria = [];
      if (order_id) lookupCriteria.push({ id: order_id });
      if (order_number) lookupCriteria.push({ order_number });
      if (order_id) lookupCriteria.push({ order_number: order_id });

      let order = await prisma.order.findFirst({
        where: lookupCriteria.length ? { OR: lookupCriteria } : { notes: { contains: razorpay_order_id } },
      });

      if (!order) {
        // Fallback: check if notes contains the rzp order id
        order = await prisma.order.findFirst({
          where: { notes: { contains: razorpay_order_id } },
        });
      }

      if (!order) {
        throw new AppError(["Associated order not found for payment verification"], StatusCodes.NOT_FOUND);
      }

      // 3. Check for existing payment record with this transaction ref (idempotent DB safeguard)
      let payment = await prisma.payment.findFirst({
        where: { transaction_ref: razorpay_payment_id },
      });

      if (!payment) {
        const pNum = `PAY-${Date.now().toString().slice(-6)}`;
        payment = await prisma.payment.create({
          data: {
            payment_id: pNum,
            payment_number: pNum,
            order_id: order.id,
            order_number: order.order_number,
            customer_name: order.customer_name,
            amount: Number(order.total_amount),
            payment_method: "ONLINE",
            transaction_ref: razorpay_payment_id,
            status: "SUCCESS",
            note: `Razorpay Payment ID: ${razorpay_payment_id}, Order: ${razorpay_order_id}`,
            notes: `Razorpay Payment ID: ${razorpay_payment_id}, Order: ${razorpay_order_id}`,
          },
        });
      }

      // 4. Update Order status and history
      const history = Array.isArray(order.status_history) ? [...order.status_history] : [];
      const paymentAlreadyRecorded = history.some((h) => h.status === "PAYMENT_CONFIRMED");

      if (!paymentAlreadyRecorded) {
        history.push({
          status: "PAYMENT_CONFIRMED",
          label: "Payment Confirmed",
          timestamp: new Date().toISOString(),
          note: `Payment of ₹${order.total_amount} received via Razorpay (${razorpay_payment_id}). Awaiting admin review and approval.`,
        });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paid_amount: Number(order.total_amount),
          pending_amount: 0,
          payment_status: "PAID",
          status_history: history,
        },
      });

      // 5. Send order notification email if customer email exists
      if (updatedOrder.customer_email) {
        EmailService.sendOrderStatusNotification({
          to: updatedOrder.customer_email,
          name: updatedOrder.customer_name || "Customer",
          orderNumber: updatedOrder.order_number,
          status: "PAYMENT_CONFIRMED (Awaiting Admin Approval)",
          notes: `Thank you for your payment of ₹${updatedOrder.total_amount}. Your order is now awaiting admin review and approval before entering production.`,
          totalAmount: updatedOrder.total_amount,
        }).catch((err) => {
          console.warn("[PaymentService] Failed to send payment confirmation email:", err.message);
        });
      }

      return {
        success: true,
        message: "Payment successfully verified and order marked as paid",
        order: updatedOrder,
        payment,
      };
    } catch (error) {
      console.error("[PaymentService] Error verifying Razorpay payment:", error);
      handlePrismaError(error);
    }
  }
}

export default new PaymentService();

