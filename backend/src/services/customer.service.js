import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeCustomerOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
    gst_number: item.gst_number || item.gstin || "",
    gstin: item.gstin || item.gst_number || "",
    total_revenue: item.total_revenue || item.total_spent || 0,
    total_spent: item.total_spent || item.total_revenue || 0,
  };
}

class CustomerService {
  async createCustomer(params) {
    try {
      if (!params.name || !params.phone) {
        throw new AppError(["Name and phone are required for a customer"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (!data.customer_id) {
        data.customer_id = `CUST-${Date.now()}`;
      }

      if (data.gst_number && !data.gstin) {
        data.gstin = data.gst_number;
      }
      if (data.gstin && !data.gst_number) {
        data.gst_number = data.gstin;
      }
      if (data.total_spent !== undefined && data.total_revenue === undefined) {
        data.total_revenue = Number(data.total_spent);
      }
      if (data.total_revenue !== undefined && data.total_spent === undefined) {
        data.total_spent = Number(data.total_revenue);
      }
      if (data.total_orders !== undefined) {
        data.total_orders = parseInt(data.total_orders, 10) || 0;
      }

      const customer = await prisma.customer.create({ data });
      return normalizeCustomerOutput(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      handlePrismaError(error);
    }
  }

  async getAllCustomers(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", status, search } = query;
      const where = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
          { business_name: { contains: search } },
          { customer_id: { contains: search } },
        ];
      }

      const orderBy = {};
      const actualSortBy = sortBy || (sort && sort.replace(/^-/, "")) || "createdAt";
      const actualSortOrder = sortOrder || (sort && sort.startsWith("-") ? "desc" : "asc") || "desc";
      orderBy[actualSortBy] = actualSortOrder;

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [items, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        prisma.customer.count({ where }),
      ]);

      return {
        items: items.map(normalizeCustomerOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error retrieving customers:", error);
      handlePrismaError(error);
    }
  }

  async getCustomerById(id) {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [{ id }, { customer_id: id }, { phone: id }],
        },
      });
      if (!customer) {
        throw new AppError(["Customer not found"], StatusCodes.NOT_FOUND);
      }
      return normalizeCustomerOutput(customer);
    } catch (error) {
      console.error("Error retrieving customer:", error);
      handlePrismaError(error);
    }
  }

  async updateCustomer(id, params) {
    try {
      const existing = await prisma.customer.findFirst({
        where: { OR: [{ id }, { customer_id: id }] },
      });
      if (!existing) {
        throw new AppError(["Customer not found"], StatusCodes.NOT_FOUND);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.gst_number && !data.gstin) data.gstin = data.gst_number;
      if (data.gstin && !data.gst_number) data.gst_number = data.gstin;
      if (data.total_spent !== undefined) data.total_spent = Number(data.total_spent);
      if (data.total_revenue !== undefined) data.total_revenue = Number(data.total_revenue);
      if (data.total_orders !== undefined) data.total_orders = parseInt(data.total_orders, 10) || 0;

      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data,
      });
      return normalizeCustomerOutput(updated);
    } catch (error) {
      console.error("Error updating customer:", error);
      handlePrismaError(error);
    }
  }

  async deleteCustomer(id) {
    try {
      const existing = await prisma.customer.findFirst({
        where: { OR: [{ id }, { customer_id: id }] },
      });
      if (!existing) {
        throw new AppError(["Customer not found"], StatusCodes.NOT_FOUND);
      }

      await prisma.customer.delete({ where: { id: existing.id } });
      return { id: existing.id };
    } catch (error) {
      console.error("Error deleting customer:", error);
      handlePrismaError(error);
    }
  }
}

export default new CustomerService();

