import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeMediaOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class MediaService {
  async createMediaItem(params) {
    try {
      if (!params.url) {
        throw new AppError(["Media URL is required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (!data.filename) {
        data.filename = data.url.split("/").pop().split("?")[0] || "file";
      }
      if (data.file_size !== undefined) {
        data.file_size = parseInt(data.file_size, 10) || 0;
      }

      const media = await prisma.mediaItem.create({ data });
      return normalizeMediaOutput(media);
    } catch (error) {
      console.error("Error creating media item:", error);
      handlePrismaError(error);
    }
  }

  async getAllMediaItems(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", type, linked_id, search } = query;
      const where = {};

      if (type) where.type = type;
      if (linked_id) where.linked_id = linked_id;

      if (search) {
        where.OR = [
          { filename: { contains: search } },
          { alt_text: { contains: search } },
        ];
      }

      const orderBy = {};
      const actualSortBy = sortBy || (sort && sort.replace(/^-/, "")) || "createdAt";
      const actualSortOrder = sortOrder || (sort && sort.startsWith("-") ? "desc" : "asc") || "desc";
      orderBy[actualSortBy] = actualSortOrder;

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [items, total] = await Promise.all([
        prisma.mediaItem.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        prisma.mediaItem.count({ where }),
      ]);

      return {
        items: items.map(normalizeMediaOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error retrieving media items:", error);
      handlePrismaError(error);
    }
  }

  async getMediaItemById(id) {
    try {
      const media = await prisma.mediaItem.findUnique({ where: { id } });
      if (!media) {
        throw new AppError(["Media item not found"], StatusCodes.NOT_FOUND);
      }
      return normalizeMediaOutput(media);
    } catch (error) {
      console.error("Error retrieving media item:", error);
      handlePrismaError(error);
    }
  }

  async updateMediaItem(id, params) {
    try {
      const existing = await prisma.mediaItem.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Media item not found"], StatusCodes.NOT_FOUND);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.file_size !== undefined) {
        data.file_size = parseInt(data.file_size, 10) || 0;
      }

      const updated = await prisma.mediaItem.update({
        where: { id },
        data,
      });
      return normalizeMediaOutput(updated);
    } catch (error) {
      console.error("Error updating media item:", error);
      handlePrismaError(error);
    }
  }

  async deleteMediaItem(id) {
    try {
      const existing = await prisma.mediaItem.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Media item not found"], StatusCodes.NOT_FOUND);
      }

      await prisma.mediaItem.delete({ where: { id } });
      return { id };
    } catch (error) {
      console.error("Error deleting media item:", error);
      handlePrismaError(error);
    }
  }
}

export default new MediaService();

