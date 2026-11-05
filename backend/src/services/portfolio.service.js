import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizePortfolioOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class PortfolioService {
  async createPortfolioItem(params) {
    try {
      if (!params.title || !params.image_url) {
        throw new AppError(["Title and image URL are required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (!data.category) {
        data.category = "PRINTING";
      }
      if (data.is_featured !== undefined) {
        data.is_featured = Boolean(data.is_featured);
      }

      const item = await prisma.portfolioItem.create({ data });
      return normalizePortfolioOutput(item);
    } catch (error) {
      console.error("Error creating portfolio item:", error);
      handlePrismaError(error);
    }
  }

  async getAllPortfolioItems(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", category, is_featured, search } = query;
      const where = {};

      if (category) where.category = category;
      if (is_featured !== undefined && is_featured !== "") {
        where.is_featured = is_featured === "true" || is_featured === true;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { client: { contains: search } },
        ];
      }

      const orderBy = {};
      const actualSortBy = sortBy || (sort && sort.replace(/^-/, "")) || "createdAt";
      const actualSortOrder = sortOrder || (sort && sort.startsWith("-") ? "desc" : "asc") || "desc";
      orderBy[actualSortBy] = actualSortOrder;

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [items, total] = await Promise.all([
        prisma.portfolioItem.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        prisma.portfolioItem.count({ where }),
      ]);

      return {
        items: items.map(normalizePortfolioOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error retrieving portfolio items:", error);
      handlePrismaError(error);
    }
  }

  async getPortfolioItemById(id) {
    try {
      const item = await prisma.portfolioItem.findUnique({ where: { id } });
      if (!item) {
        throw new AppError(["Portfolio item not found"], StatusCodes.NOT_FOUND);
      }
      return normalizePortfolioOutput(item);
    } catch (error) {
      console.error("Error retrieving portfolio item:", error);
      handlePrismaError(error);
    }
  }

  async updatePortfolioItem(id, params) {
    try {
      const existing = await prisma.portfolioItem.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Portfolio item not found"], StatusCodes.NOT_FOUND);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.is_featured !== undefined) {
        data.is_featured = Boolean(data.is_featured);
      }

      const updated = await prisma.portfolioItem.update({
        where: { id },
        data,
      });
      return normalizePortfolioOutput(updated);
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      handlePrismaError(error);
    }
  }

  async deletePortfolioItem(id) {
    try {
      const existing = await prisma.portfolioItem.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Portfolio item not found"], StatusCodes.NOT_FOUND);
      }

      await prisma.portfolioItem.delete({ where: { id } });
      return { id };
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      handlePrismaError(error);
    }
  }
}

export default new PortfolioService();

