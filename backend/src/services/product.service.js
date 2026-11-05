import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeProductOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
    moq: item.moq !== undefined ? item.moq : item.min_order_quantity,
  };
}

class ProductService {
  async createProduct(params) {
    try {
      if (!params.name) {
        throw new AppError(["Product name is required"], StatusCodes.BAD_REQUEST);
      }

      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.moq !== undefined) {
        data.moq = Number(data.moq);
        data.min_order_quantity = Number(data.moq);
      }
      if (data.starting_price !== undefined) data.starting_price = Number(data.starting_price);
      if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order);

      const product = await prisma.product.create({ data });
      return normalizeProductOutput(product);
    } catch (error) {
      console.error("Error creating product:", error);
      handlePrismaError(error);
    }
  }

  async getAllProducts(query = {}) {
    try {
      const {
        page,
        limit,
        sort,
        sortBy = "createdAt",
        sortOrder = "desc",
        category,
        status,
        is_featured,
        search,
        industry,
      } = query;

      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: String(search) } },
          { slug: { contains: String(search) } },
          { sku: { contains: String(search) } },
          { description: { contains: String(search) } },
        ];
      }
      if (category) where.category = category;
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
        orderBy[mapped] = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";
      }

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : undefined;

      let [products, total] = await Promise.all([
        prisma.product.findMany({ where, orderBy, take, skip }),
        prisma.product.count({ where }),
      ]);

      if (industry) {
        products = products.filter((p) => Array.isArray(p.industries) && p.industries.includes(industry));
      }

      return {
        items: products.map(normalizeProductOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      handlePrismaError(error);
    }
  }

  async getProductById(idOrSlug) {
    try {
      if (!idOrSlug) {
        throw new AppError(["Product ID or slug is required"], StatusCodes.BAD_REQUEST);
      }

      let product = await prisma.product.findUnique({
        where: { id: idOrSlug },
      }).catch(() => null);

      if (!product) {
        product = await prisma.product.findUnique({
          where: { slug: idOrSlug },
        }).catch(() => null);
      }

      if (!product) {
        throw new AppError(["Product not found"], StatusCodes.NOT_FOUND);
      }

      return normalizeProductOutput(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      handlePrismaError(error);
    }
  }

  async updateProduct(id, params) {
    try {
      if (!id) {
        throw new AppError(["Product ID is required for update"], StatusCodes.BAD_REQUEST);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.moq !== undefined) {
        data.moq = Number(data.moq);
        data.min_order_quantity = Number(data.moq);
      }
      if (data.starting_price !== undefined) data.starting_price = Number(data.starting_price);
      if (data.sort_order !== undefined) data.sort_order = Number(data.sort_order);

      const product = await prisma.product.update({
        where: { id },
        data,
      });

      return normalizeProductOutput(product);
    } catch (error) {
      console.error("Error updating product:", error);
      handlePrismaError(error);
    }
  }

  async deleteProduct(id) {
    try {
      if (!id) {
        throw new AppError(["Product ID is required for delete"], StatusCodes.BAD_REQUEST);
      }
      await prisma.product.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      handlePrismaError(error);
    }
  }

  async bulkUpdate(items = []) {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError(["Items array is required for bulk update"], StatusCodes.BAD_REQUEST);
      }

      const updates = items.map((item) => {
        const { id, ...data } = item;
        delete data.createdAt;
        delete data.updatedAt;
        if (data.moq !== undefined) {
          data.moq = Number(data.moq);
          data.min_order_quantity = Number(data.moq);
        }
        if (data.starting_price !== undefined) data.starting_price = Number(data.starting_price);
        return prisma.product.update({ where: { id }, data });
      });

      const results = await prisma.$transaction(updates);
      return { updatedCount: results.length };
    } catch (error) {
      console.error("Error in ProductService.bulkUpdate:", error);
      handlePrismaError(error);
    }
  }

  async deleteMany(ids = []) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError(["IDs array is required for deleteMany"], StatusCodes.BAD_REQUEST);
      }
      const result = await prisma.product.deleteMany({
        where: { id: { in: ids } },
      });
      return { deletedCount: result.count };
    } catch (error) {
      console.error("Error in ProductService.deleteMany:", error);
      handlePrismaError(error);
    }
  }
}

export default new ProductService();

