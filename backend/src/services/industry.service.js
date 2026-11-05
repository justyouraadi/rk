import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeIndustryOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class IndustryService {
  async createIndustry(params) {
    try {
      if (!params.name) {
        throw new AppError(["Industry name is required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;
      if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order);

      const industry = await prisma.industry.create({ data });
      return normalizeIndustryOutput(industry);
    } catch (error) {
      console.error("Error creating industry:", error);
      handlePrismaError(error);
    }
  }

  async getAllIndustries(query = {}) {
    try {
      const { page, limit, sort, sortBy = "sort_order", sortOrder = "asc", status, is_featured, search } = query;
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: String(search) } },
          { slug: { contains: String(search) } },
          { description: { contains: String(search) } },
        ];
      }
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
      } else if (sortBy) {
        const mapped = sortBy === "created_date" ? "createdAt" : sortBy === "updated_date" ? "updatedAt" : sortBy;
        orderBy[mapped] = sortOrder.toLowerCase() === "desc" ? "desc" : "asc";
      }

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : undefined;

      const [industries, total] = await Promise.all([
        prisma.industry.findMany({ where, orderBy, take, skip }),
        prisma.industry.count({ where }),
      ]);

      return {
        items: industries.map(normalizeIndustryOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error fetching industries:", error);
      handlePrismaError(error);
    }
  }

  async getIndustryById(idOrSlug) {
    try {
      if (!idOrSlug) throw new AppError(["Industry ID or slug is required"], StatusCodes.BAD_REQUEST);

      let industry = await prisma.industry.findUnique({ where: { id: idOrSlug } }).catch(() => null);
      if (!industry) {
        industry = await prisma.industry.findUnique({ where: { slug: idOrSlug } }).catch(() => null);
      }
      if (!industry) throw new AppError(["Industry not found"], StatusCodes.NOT_FOUND);

      return normalizeIndustryOutput(industry);
    } catch (error) {
      console.error("Error fetching industry:", error);
      handlePrismaError(error);
    }
  }

  async updateIndustry(id, params) {
    try {
      if (!id) throw new AppError(["Industry ID is required for update"], StatusCodes.BAD_REQUEST);
      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;
      if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order);

      const industry = await prisma.industry.update({ where: { id }, data });
      return normalizeIndustryOutput(industry);
    } catch (error) {
      console.error("Error updating industry:", error);
      handlePrismaError(error);
    }
  }

  async deleteIndustry(id) {
    try {
      if (!id) throw new AppError(["Industry ID is required for delete"], StatusCodes.BAD_REQUEST);
      await prisma.industry.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      console.error("Error deleting industry:", error);
      handlePrismaError(error);
    }
  }
}

export default new IndustryService();

