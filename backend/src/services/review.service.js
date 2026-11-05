import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeReviewOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class ReviewService {
  async createReview(params) {
    try {
      if (!params.name || !params.review) {
        throw new AppError(["Name and review text are required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.rating !== undefined) {
        data.rating = parseInt(data.rating, 10) || 5;
      }
      if (data.is_approved !== undefined) {
        data.is_approved = Boolean(data.is_approved);
      }

      const review = await prisma.review.create({ data });
      return normalizeReviewOutput(review);
    } catch (error) {
      console.error("Error creating review:", error);
      handlePrismaError(error);
    }
  }

  async getAllReviews(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", is_approved, rating, search } = query;
      const where = {};

      if (is_approved !== undefined && is_approved !== "") {
        where.is_approved = is_approved === "true" || is_approved === true;
      }
      if (rating) {
        where.rating = parseInt(rating, 10);
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { business: { contains: search } },
          { review: { contains: search } },
        ];
      }

      const orderBy = {};
      const actualSortBy = sortBy || (sort && sort.replace(/^-/, "")) || "createdAt";
      const actualSortOrder = sortOrder || (sort && sort.startsWith("-") ? "desc" : "asc") || "desc";
      orderBy[actualSortBy] = actualSortOrder;

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [items, total] = await Promise.all([
        prisma.review.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        prisma.review.count({ where }),
      ]);

      return {
        items: items.map(normalizeReviewOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error retrieving reviews:", error);
      handlePrismaError(error);
    }
  }

  async getReviewById(id) {
    try {
      const review = await prisma.review.findUnique({
        where: { id },
      });
      if (!review) {
        throw new AppError(["Review not found"], StatusCodes.NOT_FOUND);
      }
      return normalizeReviewOutput(review);
    } catch (error) {
      console.error("Error retrieving review:", error);
      handlePrismaError(error);
    }
  }

  async updateReview(id, params) {
    try {
      const existing = await prisma.review.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Review not found"], StatusCodes.NOT_FOUND);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.rating !== undefined) data.rating = parseInt(data.rating, 10) || 5;
      if (data.is_approved !== undefined) data.is_approved = Boolean(data.is_approved);

      const updated = await prisma.review.update({
        where: { id },
        data,
      });
      return normalizeReviewOutput(updated);
    } catch (error) {
      console.error("Error updating review:", error);
      handlePrismaError(error);
    }
  }

  async deleteReview(id) {
    try {
      const existing = await prisma.review.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Review not found"], StatusCodes.NOT_FOUND);
      }

      await prisma.review.delete({ where: { id } });
      return { id };
    } catch (error) {
      console.error("Error deleting review:", error);
      handlePrismaError(error);
    }
  }
}

export default new ReviewService();

