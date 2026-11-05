import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeImportJobOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class ImportJobService {
  async createImportJob(params) {
    try {
      if (!params.file_name || !params.entity_type) {
        throw new AppError(["File name and entity type are required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.total_rows !== undefined) data.total_rows = parseInt(data.total_rows, 10) || 0;
      if (data.created !== undefined) data.created = parseInt(data.created, 10) || 0;
      if (data.updated !== undefined) data.updated = parseInt(data.updated, 10) || 0;
      if (data.skipped !== undefined) data.skipped = parseInt(data.skipped, 10) || 0;
      if (data.errors_count !== undefined) data.errors_count = parseInt(data.errors_count, 10) || 0;

      const job = await prisma.importJob.create({ data });
      return normalizeImportJobOutput(job);
    } catch (error) {
      console.error("Error creating import job:", error);
      handlePrismaError(error);
    }
  }

  async getAllImportJobs(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", entity_type, status } = query;
      const where = {};

      if (entity_type) where.entity_type = entity_type;
      if (status) where.status = status;

      const orderBy = {};
      const actualSortBy = sortBy || (sort && sort.replace(/^-/, "")) || "createdAt";
      const actualSortOrder = sortOrder || (sort && sort.startsWith("-") ? "desc" : "asc") || "desc";
      orderBy[actualSortBy] = actualSortOrder;

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [items, total] = await Promise.all([
        prisma.importJob.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        prisma.importJob.count({ where }),
      ]);

      return {
        items: items.map(normalizeImportJobOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error retrieving import jobs:", error);
      handlePrismaError(error);
    }
  }

  async getImportJobById(id) {
    try {
      const job = await prisma.importJob.findUnique({ where: { id } });
      if (!job) {
        throw new AppError(["Import job not found"], StatusCodes.NOT_FOUND);
      }
      return normalizeImportJobOutput(job);
    } catch (error) {
      console.error("Error retrieving import job:", error);
      handlePrismaError(error);
    }
  }

  async updateImportJob(id, params) {
    try {
      const existing = await prisma.importJob.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Import job not found"], StatusCodes.NOT_FOUND);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.total_rows !== undefined) data.total_rows = parseInt(data.total_rows, 10) || 0;
      if (data.created !== undefined) data.created = parseInt(data.created, 10) || 0;
      if (data.updated !== undefined) data.updated = parseInt(data.updated, 10) || 0;
      if (data.skipped !== undefined) data.skipped = parseInt(data.skipped, 10) || 0;
      if (data.errors_count !== undefined) data.errors_count = parseInt(data.errors_count, 10) || 0;

      const updated = await prisma.importJob.update({
        where: { id },
        data,
      });
      return normalizeImportJobOutput(updated);
    } catch (error) {
      console.error("Error updating import job:", error);
      handlePrismaError(error);
    }
  }

  async deleteImportJob(id) {
    try {
      const existing = await prisma.importJob.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Import job not found"], StatusCodes.NOT_FOUND);
      }

      await prisma.importJob.delete({ where: { id } });
      return { id };
    } catch (error) {
      console.error("Error deleting import job:", error);
      handlePrismaError(error);
    }
  }
}

export default new ImportJobService();

