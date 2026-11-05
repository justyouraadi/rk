import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeQuotationOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
    total: item.total_amount,
  };
}

class QuotationService {
  async createQuotation(params) {
    try {
      if (!params.customer_name || !params.items) {
        throw new AppError(["Customer name and items are required for quotation"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.total !== undefined) {
        if (data.total_amount === undefined) data.total_amount = Number(data.total);
        delete data.total;
      }
      if (data.total_amount !== undefined) data.total_amount = Number(data.total_amount);
      if (data.subtotal !== undefined) data.subtotal = Number(data.subtotal);
      if (data.discount !== undefined) data.discount = Number(data.discount);
      if (data.gst_percent !== undefined) data.gst_percent = Number(data.gst_percent);
      if (data.gst_amount !== undefined) data.gst_amount = Number(data.gst_amount);
      if (data.delivery_charges !== undefined) data.delivery_charges = Number(data.delivery_charges);
      if (data.other_charges !== undefined) data.other_charges = Number(data.other_charges);

      const quotation = await prisma.quotation.create({ data });
      return normalizeQuotationOutput(quotation);
    } catch (error) {
      console.error("Error creating quotation:", error);
      handlePrismaError(error);
    }
  }

  async getAllQuotations(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", status, search, lead_id, customer_id } = query;
      const where = {};
      if (search) {
        where.OR = [
          { quotation_number: { contains: String(search) } },
          { customer_name: { contains: String(search) } },
          { customer_phone: { contains: String(search) } },
        ];
      }
      if (status) where.status = status;
      if (lead_id) where.lead_id = lead_id;
      if (customer_id) where.customer_id = customer_id;
      if (query.customer_name) where.customer_name = { contains: String(query.customer_name) };
      if (query.customer_phone) where.customer_phone = { contains: String(query.customer_phone) };
      if (query.customer_email) where.customer_email = { contains: String(query.customer_email) };

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

      const [quotations, total] = await Promise.all([
        prisma.quotation.findMany({ where, orderBy, take, skip }),
        prisma.quotation.count({ where }),
      ]);

      return {
        items: quotations.map(normalizeQuotationOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error fetching quotations:", error);
      handlePrismaError(error);
    }
  }

  async getQuotationById(id) {
    try {
      if (!id) throw new AppError(["Quotation ID is required"], StatusCodes.BAD_REQUEST);

      let quotation = await prisma.quotation.findUnique({ where: { id } }).catch(() => null);
      if (!quotation) {
        quotation = await prisma.quotation.findUnique({ where: { quotation_number: id } }).catch(() => null);
      }
      if (!quotation) throw new AppError(["Quotation not found"], StatusCodes.NOT_FOUND);

      return normalizeQuotationOutput(quotation);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      handlePrismaError(error);
    }
  }

  async updateQuotation(id, params) {
    try {
      if (!id) throw new AppError(["Quotation ID is required for update"], StatusCodes.BAD_REQUEST);
      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.total !== undefined) {
        if (data.total_amount === undefined) data.total_amount = Number(data.total);
        delete data.total;
      }
      if (data.total_amount !== undefined) data.total_amount = Number(data.total_amount);
      if (data.subtotal !== undefined) data.subtotal = Number(data.subtotal);
      if (data.discount !== undefined) data.discount = Number(data.discount);
      if (data.gst_percent !== undefined) data.gst_percent = Number(data.gst_percent);
      if (data.gst_amount !== undefined) data.gst_amount = Number(data.gst_amount);
      if (data.delivery_charges !== undefined) data.delivery_charges = Number(data.delivery_charges);
      if (data.other_charges !== undefined) data.other_charges = Number(data.other_charges);

      const quotation = await prisma.quotation.update({ where: { id }, data });
      return normalizeQuotationOutput(quotation);
    } catch (error) {
      console.error("Error updating quotation:", error);
      handlePrismaError(error);
    }
  }

  async deleteQuotation(id) {
    try {
      if (!id) throw new AppError(["Quotation ID is required for delete"], StatusCodes.BAD_REQUEST);
      await prisma.quotation.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      console.error("Error deleting quotation:", error);
      handlePrismaError(error);
    }
  }
}

export default new QuotationService();

