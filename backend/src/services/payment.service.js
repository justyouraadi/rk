import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

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
}

export default new PaymentService();

