import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeOfferOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class OfferService {
  async createOffer(params) {
    try {
      if (!params.title || !params.description) {
        throw new AppError(["Title and description are required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.starting_price !== undefined) data.starting_price = Number(data.starting_price);
      if (data.is_active !== undefined) data.is_active = Boolean(data.is_active);

      const offer = await prisma.offer.create({ data });
      return normalizeOfferOutput(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      handlePrismaError(error);
    }
  }

  async getAllOffers(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", is_active, search } = query;
      const where = {};

      if (is_active !== undefined && is_active !== "") {
        where.is_active = is_active === "true" || is_active === true;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { discount: { contains: search } },
        ];
      }

      const orderBy = {};
      const actualSortBy = sortBy || (sort && sort.replace(/^-/, "")) || "createdAt";
      const actualSortOrder = sortOrder || (sort && sort.startsWith("-") ? "desc" : "asc") || "desc";
      orderBy[actualSortBy] = actualSortOrder;

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [items, total] = await Promise.all([
        prisma.offer.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        prisma.offer.count({ where }),
      ]);

      return {
        items: items.map(normalizeOfferOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error retrieving offers:", error);
      handlePrismaError(error);
    }
  }

  async getOfferById(id) {
    try {
      const offer = await prisma.offer.findUnique({ where: { id } });
      if (!offer) {
        throw new AppError(["Offer not found"], StatusCodes.NOT_FOUND);
      }
      return normalizeOfferOutput(offer);
    } catch (error) {
      console.error("Error retrieving offer:", error);
      handlePrismaError(error);
    }
  }

  async updateOffer(id, params) {
    try {
      const existing = await prisma.offer.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Offer not found"], StatusCodes.NOT_FOUND);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.starting_price !== undefined) data.starting_price = Number(data.starting_price);
      if (data.is_active !== undefined) data.is_active = Boolean(data.is_active);

      const updated = await prisma.offer.update({
        where: { id },
        data,
      });
      return normalizeOfferOutput(updated);
    } catch (error) {
      console.error("Error updating offer:", error);
      handlePrismaError(error);
    }
  }

  async deleteOffer(id) {
    try {
      const existing = await prisma.offer.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Offer not found"], StatusCodes.NOT_FOUND);
      }

      await prisma.offer.delete({ where: { id } });
      return { id };
    } catch (error) {
      console.error("Error deleting offer:", error);
      handlePrismaError(error);
    }
  }
}

export default new OfferService();

