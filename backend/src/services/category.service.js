import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeCategoryOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class CategoryService {
  async createCategory(params) {
    try {
      if (!params.name) {
        throw new AppError(["Category name is required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;
      if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order);

      const category = await prisma.category.create({ data });
      return normalizeCategoryOutput(category);
    } catch (error) {
      console.error("Error creating category:", error);
      handlePrismaError(error);
    }
  }

  async getAllCategories(query = {}) {
    try {
      const { page, limit, sort, sortBy = "sort_order", sortOrder = "asc", status, search, parent_id, industry_id } = query;
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: String(search) } },
          { slug: { contains: String(search) } },
        ];
      }
      if (status) where.status = status;
      if (parent_id !== undefined) where.parent_id = parent_id || null;
      if (industry_id) where.industry_id = industry_id;

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

      const [categories, total] = await Promise.all([
        prisma.category.findMany({ where, orderBy, take, skip }),
        prisma.category.count({ where }),
      ]);

      return {
        items: categories.map(normalizeCategoryOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error fetching categories:", error);
      handlePrismaError(error);
    }
  }

  async getCategoryById(idOrSlug) {
    try {
      if (!idOrSlug) throw new AppError(["Category ID or slug is required"], StatusCodes.BAD_REQUEST);

      let category = await prisma.category.findUnique({ where: { id: idOrSlug } }).catch(() => null);
      if (!category) {
        category = await prisma.category.findUnique({ where: { slug: idOrSlug } }).catch(() => null);
      }
      if (!category) throw new AppError(["Category not found"], StatusCodes.NOT_FOUND);

      return normalizeCategoryOutput(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      handlePrismaError(error);
    }
  }

  async updateCategory(id, params) {
    try {
      if (!id) throw new AppError(["Category ID is required for update"], StatusCodes.BAD_REQUEST);
      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;
      if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order);

      const category = await prisma.category.update({ where: { id }, data });
      return normalizeCategoryOutput(category);
    } catch (error) {
      console.error("Error updating category:", error);
      handlePrismaError(error);
    }
  }

  async deleteCategory(id) {
    try {
      if (!id) throw new AppError(["Category ID is required for delete"], StatusCodes.BAD_REQUEST);
      await prisma.category.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      console.error("Error deleting category:", error);
      handlePrismaError(error);
    }
  }
}

export default new CategoryService();

