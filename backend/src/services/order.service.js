import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";
import EmailService from "./email.service.js";

function normalizeOrderOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
    status: item.status || item.order_status,
  };
}

class OrderService {
  async createOrder(params) {
    try {
      if (!params.order_number || !params.customer_name) {
        throw new AppError(["Order number and customer name are required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.status) {
        data.order_status = data.status;
      }
      if (data.total !== undefined) {
        if (data.total_amount === undefined) data.total_amount = Number(data.total);
        delete data.total;
      }
      if (data.total_amount !== undefined) data.total_amount = Number(data.total_amount);
      if (data.paid_amount !== undefined) data.paid_amount = Number(data.paid_amount);
      if (data.pending_amount !== undefined) data.pending_amount = Number(data.pending_amount);

      const order = await prisma.order.create({ data });
      return normalizeOrderOutput(order);
    } catch (error) {
      console.error("Error creating order:", error);
      handlePrismaError(error);
    }
  }

  async getAllOrders(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", status, payment_status, search, customer_phone, customer_id } = query;
      const where = {};
      if (search) {
        where.OR = [
          { order_number: { contains: String(search) } },
          { customer_name: { contains: String(search) } },
          { customer_phone: { contains: String(search) } },
        ];
      }
      if (status) {
        where.OR = [
          { status: status },
          { order_status: status },
        ];
      }
      if (payment_status) where.payment_status = payment_status;
      if (customer_phone) where.customer_phone = { contains: String(customer_phone) };
      if (customer_id) where.customer_id = customer_id;
      if (query.customer_name) where.customer_name = { contains: String(query.customer_name) };
      if (query.customer_email) where.customer_email = { contains: String(query.customer_email) };
      if (query.user_id) where.user_id = query.user_id;

      const orderBy = {};
      if (sort) {
        if (sort.startsWith("-")) {
          const field = sort.slice(1);
          const mapped = field === "created_date" ? "createdAt" : field === "updated_date" ? "updatedAt" : field;
          orderBy[mapped] = "desc";
        } else {
          const mapped = sort === "created_date" ? "createdAt" : sort === "updated_date" ? "updatedAt" : sort;
          orderBy[mapped] = "asc";
        }
      } else if (sortBy) {
        const mapped = sortBy === "created_date" ? "createdAt" : sortBy === "updated_date" ? "updatedAt" : sortBy;
        orderBy[mapped] = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";
      }

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : undefined;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({ where, orderBy, take, skip }),
        prisma.order.count({ where }),
      ]);

      return {
        items: orders.map(normalizeOrderOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error fetching orders:", error);
      handlePrismaError(error);
    }
  }

  async trackOrder(orderNumber) {
    try {
      if (!orderNumber) throw new AppError(["Order number is required"], StatusCodes.BAD_REQUEST);
      const raw = String(orderNumber).trim();
      const stripped = raw.replace(/^RK-|^rk-/i, "").trim();
      const digits = raw.replace(/\D/g, "");

      if (raw === "ORD-1793879981163" || raw.includes("1793879981163")) {
        const legacyMatch = await prisma.order.findFirst({
          where: {
            OR: [
              { order_number: "ORD-291721" },
              { order_number: "ORD-1793879981163" },
            ],
          },
        });
        if (legacyMatch) return normalizeOrderOutput(legacyMatch);
      }

      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { order_number: { equals: raw } },
            { order_number: { equals: stripped } },
            { order_number: { contains: raw } },
            { order_number: { contains: stripped } },
            { id: { equals: raw } },
            ...(digits.length >= 6 ? [{ order_number: { contains: digits } }] : []),
          ],
        },
      });

      if (!order) throw new AppError([`Order "${orderNumber}" not found. Please verify your order number.`], StatusCodes.NOT_FOUND);
      return normalizeOrderOutput(order);
    } catch (error) {
      console.error("Error tracking order:", error);
      handlePrismaError(error);
    }
  }

  async getOrderById(id) {
    try {
      if (!id) throw new AppError(["Order ID is required"], StatusCodes.BAD_REQUEST);

      let order = await prisma.order.findUnique({ where: { id } }).catch(() => null);
      if (!order) {
        order = await prisma.order.findUnique({ where: { order_number: id } }).catch(() => null);
      }
      if (!order) throw new AppError(["Order not found"], StatusCodes.NOT_FOUND);

      return normalizeOrderOutput(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      handlePrismaError(error);
    }
  }

  async updateOrder(id, params) {
    try {
      if (!id) throw new AppError(["Order ID is required for update"], StatusCodes.BAD_REQUEST);
      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.status) {
        data.order_status = data.status;
      }
      if (data.total !== undefined) {
        if (data.total_amount === undefined) data.total_amount = Number(data.total);
        delete data.total;
      }
      if (data.total_amount !== undefined) data.total_amount = Number(data.total_amount);
      if (data.paid_amount !== undefined) data.paid_amount = Number(data.paid_amount);
      if (data.pending_amount !== undefined) data.pending_amount = Number(data.pending_amount);

      const order = await prisma.order.update({ where: { id }, data });

      if (order.customer_email && (data.order_status || data.status)) {
        EmailService.sendOrderStatusNotification({
          to: order.customer_email,
          name: order.customer_name || "Customer",
          orderNumber: order.order_number,
          status: order.order_status || order.status,
          notes: order.notes,
          totalAmount: order.total_amount,
        }).catch((err) => {
          console.error("[OrderService] Failed to send order status email:", err.message);
        });
      }

      return normalizeOrderOutput(order);
    } catch (error) {
      console.error("Error updating order:", error);
      handlePrismaError(error);
    }
  }

  async deleteOrder(id) {
    try {
      if (!id) throw new AppError(["Order ID is required for delete"], StatusCodes.BAD_REQUEST);
      await prisma.order.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      console.error("Error deleting order:", error);
      handlePrismaError(error);
    }
  }
}

export default new OrderService();

