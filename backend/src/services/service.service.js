import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

const VALID_CATEGORIES = ["PRINTING", "BRANDING", "PACKAGING", "PROMOTIONAL"];

function normalizeCategory(val) {
  if (!val) return "PRINTING";
  const up = String(val).toUpperCase();
  return VALID_CATEGORIES.includes(up) ? up : "PRINTING";
}

function normalizeServiceOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class PrintingServiceService {
  async createService(params) {
    try {
      if (!params.title) {
        throw new AppError(["Service title is required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      data.category = normalizeCategory(data.category);
      if (!data.slug) {
        data.slug = `${data.title}-${Date.now()}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order);
      if (data.starting_price !== undefined) data.starting_price = Number(data.starting_price);

      const service = await prisma.service.create({ data });
      return normalizeServiceOutput(service);
    } catch (error) {
      console.error("Error creating service:", error);
      handlePrismaError(error);
    }
  }

  async getAllServices(query = {}) {
    try {
      const { page, limit, sort, sortBy = "sort_order", sortOrder = "asc", category, status, is_featured, search, industry } = query;
      const where = {};
      if (search) {
        where.OR = [
          { title: { contains: String(search) } },
          { slug: { contains: String(search) } },
          { description: { contains: String(search) } },
        ];
      }
      if (category) where.category = normalizeCategory(category);
      if (status) where.status = status;
      if (is_featured !== undefined) where.is_featured = is_featured === "true" || is_featured === true;

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
      } else {
        orderBy[sortBy] = sortOrder;
      }

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          orderBy,
          skip,
          take,
        }),
        prisma.service.count({ where }),
      ]);

      let items = services.map(normalizeServiceOutput);
      if (industry) {
        items = items.filter((s) => {
          if (Array.isArray(s.industries)) {
            return s.industries.includes(industry);
          }
          return true;
        });
      }

      return {
        items,
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error fetching services:", error);
      handlePrismaError(error);
    }
  }

  async getServiceById(idOrSlug) {
    try {
      if (!idOrSlug) throw new AppError(["Service ID or slug is required"], StatusCodes.BAD_REQUEST);

      let service = await prisma.service.findUnique({ where: { id: idOrSlug } }).catch(() => null);
      if (!service) {
        service = await prisma.service.findUnique({ where: { slug: idOrSlug } }).catch(() => null);
      }
      if (!service) throw new AppError(["Service not found"], StatusCodes.NOT_FOUND);

      return normalizeServiceOutput(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      handlePrismaError(error);
    }
  }

  async updateService(id, params) {
    try {
      if (!id) throw new AppError(["Service ID is required for update"], StatusCodes.BAD_REQUEST);
      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (params.category !== undefined) {
        data.category = normalizeCategory(params.category);
      }
      if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order);
      if (data.starting_price !== undefined) data.starting_price = Number(data.starting_price);

      const service = await prisma.service.update({ where: { id }, data });
      return normalizeServiceOutput(service);
    } catch (error) {
      console.error("Error updating service:", error);
      handlePrismaError(error);
    }
  }

  async deleteService(id) {
    try {
      if (!id) throw new AppError(["Service ID is required for delete"], StatusCodes.BAD_REQUEST);
      await prisma.service.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      console.error("Error deleting service:", error);
      handlePrismaError(error);
    }
  }
}

export default new PrintingServiceService();
