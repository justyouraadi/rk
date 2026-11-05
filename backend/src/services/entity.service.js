import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

// Mapping from various frontend entity naming styles to Prisma client model accessors
const MODEL_MAP = {
  product: "product",
  products: "product",
  service: "service",
  services: "service",
  industry: "industry",
  industries: "industry",
  category: "category",
  categories: "category",
  lead: "lead",
  leads: "lead",
  quotation: "quotation",
  quotations: "quotation",
  order: "order",
  orders: "order",
  payment: "payment",
  payments: "payment",
  review: "review",
  reviews: "review",
  offer: "offer",
  offers: "offer",
  portfolio: "portfolioItem",
  portfolioitem: "portfolioItem",
  portfolioitems: "portfolioItem",
  portfolio_items: "portfolioItem",
  media: "mediaItem",
  mediaitem: "mediaItem",
  mediaitems: "mediaItem",
  media_items: "mediaItem",
  customer: "customer",
  customers: "customer",
  admin: "admin",
  admins: "admin",
  user: "user",
  users: "user",
  notification: "notification",
  notifications: "notification",
  importjob: "importJob",
  importjobs: "importJob",
  import_job: "importJob",
  import_jobs: "importJob",
  "import-job": "importJob",
  "import-jobs": "importJob",
};

function normalizeItemOutput(modelName, item) {
  if (!item || typeof item !== "object") return item;

  const out = { ...item };
  if (item.createdAt) {
    out.created_date = item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString();
  }
  if (item.updatedAt) {
    out.updated_date = item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString();
  }

  if (modelName === "order") {
    out.status = item.status || item.order_status;
  } else if (modelName === "quotation") {
    out.total = item.total_amount;
  } else if (modelName === "payment") {
    out.payment_number = item.payment_number || item.payment_id;
    out.method = item.method || item.payment_method;
    out.note = item.note || item.notes;
  } else if (modelName === "customer") {
    out.total_revenue = item.total_revenue !== undefined ? item.total_revenue : item.total_spent;
    out.gst_number = item.gst_number || item.gstin;
  } else if (modelName === "product") {
    out.moq = item.moq !== undefined ? item.moq : item.min_order_quantity;
  }

  return out;
}

function normalizeItemInput(modelName, data) {
  const cleaned = { ...data };

  // Strip client IDs
  if (!cleaned.id || String(cleaned.id).startsWith("local-")) {
    delete cleaned.id;
  }
  delete cleaned.createdAt;
  delete cleaned.updatedAt;
  delete cleaned.created_date;
  delete cleaned.updated_date;

  if (modelName === "order") {
    if (cleaned.status) {
      cleaned.order_status = cleaned.status;
    }
    if (cleaned.total !== undefined) {
      if (cleaned.total_amount === undefined) cleaned.total_amount = Number(cleaned.total);
      delete cleaned.total;
    }
    if (cleaned.total_amount !== undefined) cleaned.total_amount = Number(cleaned.total_amount);
    if (cleaned.paid_amount !== undefined) cleaned.paid_amount = Number(cleaned.paid_amount);
    if (cleaned.pending_amount !== undefined) cleaned.pending_amount = Number(cleaned.pending_amount);
  } else if (modelName === "product") {
    if (cleaned.moq !== undefined) {
      cleaned.moq = Number(cleaned.moq);
      cleaned.min_order_quantity = Number(cleaned.moq);
    }
    if (cleaned.starting_price !== undefined) {
      cleaned.starting_price = Number(cleaned.starting_price);
    }
    if (cleaned.sort_order !== undefined) {
      cleaned.sort_order = Number(cleaned.sort_order);
    }
  } else if (modelName === "quotation") {
    if (cleaned.total !== undefined) {
      if (cleaned.total_amount === undefined) cleaned.total_amount = Number(cleaned.total);
      delete cleaned.total;
    }
    if (cleaned.total_amount !== undefined) cleaned.total_amount = Number(cleaned.total_amount);
    if (cleaned.subtotal !== undefined) cleaned.subtotal = Number(cleaned.subtotal);
    if (cleaned.discount !== undefined) cleaned.discount = Number(cleaned.discount);
    if (cleaned.gst_percent !== undefined) cleaned.gst_percent = Number(cleaned.gst_percent);
    if (cleaned.gst_amount !== undefined) cleaned.gst_amount = Number(cleaned.gst_amount);
    if (cleaned.delivery_charges !== undefined) cleaned.delivery_charges = Number(cleaned.delivery_charges);
    if (cleaned.other_charges !== undefined) cleaned.other_charges = Number(cleaned.other_charges);
  } else if (modelName === "payment") {
    if (cleaned.amount !== undefined) cleaned.amount = Number(cleaned.amount);
    if (cleaned.payment_number) {
      cleaned.payment_id = cleaned.payment_number;
    }
    if (cleaned.note) {
      cleaned.notes = cleaned.note;
    }
  } else if (modelName === "customer") {
    if (cleaned.total_revenue !== undefined) {
      cleaned.total_revenue = Number(cleaned.total_revenue);
      cleaned.total_spent = Number(cleaned.total_revenue);
    }
    if (cleaned.total_orders !== undefined) {
      cleaned.total_orders = Number(cleaned.total_orders);
    }
    if (cleaned.gst_number && !cleaned.gstin) {
      cleaned.gstin = cleaned.gst_number;
    }
  } else if (modelName === "service" || modelName === "industry" || modelName === "category") {
    if (cleaned.sort_order !== undefined) {
      cleaned.sort_order = Number(cleaned.sort_order);
    }
    if (cleaned.starting_price !== undefined) {
      cleaned.starting_price = Number(cleaned.starting_price);
    }
  }

  return cleaned;
}

class EntityService {
  getModel(entityName) {
    if (!entityName) {
      throw new AppError(["Entity name is required"], StatusCodes.BAD_REQUEST);
    }
    const key = entityName.toLowerCase();
    const modelAccessor = MODEL_MAP[key];
    if (!modelAccessor || !prisma[modelAccessor]) {
      throw new AppError(
        [`Unknown entity: ${entityName}`],
        StatusCodes.BAD_REQUEST
      );
    }
    return { model: prisma[modelAccessor], modelName: modelAccessor };
  }

  async list(entityName, query = {}) {
    try {
      const { model, modelName } = this.getModel(entityName);
      const {
        page,
        limit,
        sort,
        sortBy = "createdAt",
        sortOrder = "desc",
        ...filters
      } = query;

      // Build where clause
      const where = {};
      for (const [key, val] of Object.entries(filters)) {
        if (val === undefined || val === null || val === "") continue;
        if (key === "search") {
          where.OR = [
            { name: { contains: String(val) } },
            { title: { contains: String(val) } },
          ];
          continue;
        }

        if (val === "true" || val === true) where[key] = true;
        else if (val === "false" || val === false) where[key] = false;
        else if (
          !isNaN(val) &&
          typeof val === "string" &&
          (key.includes("id") || key.includes("price") || key.includes("count") || key.includes("order"))
        ) {
          where[key] = Number(val);
        } else {
          where[key] = val;
        }
      }

      // Build orderBy clause
      const orderBy = {};
      if (sort) {
        if (sort.startsWith("-")) {
          const field = sort.slice(1);
          const mappedField = field === "created_date" ? "createdAt" : field === "updated_date" ? "updatedAt" : field;
          orderBy[mappedField] = "desc";
        } else {
          const mappedField = sort === "created_date" ? "createdAt" : sort === "updated_date" ? "updatedAt" : sort;
          orderBy[mappedField] = "asc";
        }
      } else if (sortBy) {
        const mappedField = sortBy === "created_date" ? "createdAt" : sortBy === "updated_date" ? "updatedAt" : sortBy;
        orderBy[mappedField] = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";
      }

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : undefined;

      const [items, total] = await Promise.all([
        model.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        model.count({ where }),
      ]);

      const normalized = items.map((it) => normalizeItemOutput(modelName, it));

      return {
        items: normalized,
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error(`Error in EntityService.list(${entityName}):`, error);
      handlePrismaError(error);
    }
  }

  async get(entityName, idOrSlug) {
    try {
      const { model, modelName } = this.getModel(entityName);
      if (!idOrSlug) {
        throw new AppError(["ID or slug is required"], StatusCodes.BAD_REQUEST);
      }

      let item = await model.findUnique({
        where: { id: idOrSlug },
      }).catch(() => null);

      if (!item) {
        // Try slug if supported
        try {
          item = await model.findUnique({
            where: { slug: idOrSlug },
          });
        } catch {
          // model might not have slug
        }
      }

      if (!item) {
        throw new AppError([`${entityName} not found`], StatusCodes.NOT_FOUND);
      }

      return normalizeItemOutput(modelName, item);
    } catch (error) {
      console.error(`Error in EntityService.get(${entityName}):`, error);
      handlePrismaError(error);
    }
  }

  async create(entityName, data) {
    try {
      const { model, modelName } = this.getModel(entityName);
      const cleanedData = normalizeItemInput(modelName, data);

      const item = await model.create({
        data: cleanedData,
      });

      return normalizeItemOutput(modelName, item);
    } catch (error) {
      console.error(`Error in EntityService.create(${entityName}):`, error);
      handlePrismaError(error);
    }
  }

  async update(entityName, id, data) {
    try {
      const { model, modelName } = this.getModel(entityName);
      if (!id) {
        throw new AppError(["ID is required for update"], StatusCodes.BAD_REQUEST);
      }

      const cleanedData = normalizeItemInput(modelName, data);

      const item = await model.update({
        where: { id },
        data: cleanedData,
      });

      return normalizeItemOutput(modelName, item);
    } catch (error) {
      console.error(`Error in EntityService.update(${entityName}):`, error);
      handlePrismaError(error);
    }
  }

  async delete(entityName, id) {
    try {
      const { model } = this.getModel(entityName);
      if (!id) {
        throw new AppError(["ID is required for delete"], StatusCodes.BAD_REQUEST);
      }

      await model.delete({
        where: { id },
      });

      return { id, deleted: true };
    } catch (error) {
      console.error(`Error in EntityService.delete(${entityName}):`, error);
      handlePrismaError(error);
    }
  }

  async bulkUpdate(entityName, items = []) {
    try {
      const { model, modelName } = this.getModel(entityName);
      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError(["Items array is required for bulk update"], StatusCodes.BAD_REQUEST);
      }

      const updates = items.map((item) => {
        const { id, ...data } = item;
        const cleanedData = normalizeItemInput(modelName, data);
        return model.update({
          where: { id },
          data: cleanedData,
        });
      });

      const results = await prisma.$transaction(updates);
      return { updatedCount: results.length };
    } catch (error) {
      console.error(`Error in EntityService.bulkUpdate(${entityName}):`, error);
      handlePrismaError(error);
    }
  }

  async deleteMany(entityName, ids = []) {
    try {
      const { model } = this.getModel(entityName);
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError(["IDs array is required for deleteMany"], StatusCodes.BAD_REQUEST);
      }

      const result = await model.deleteMany({
        where: { id: { in: ids } },
      });

      return { deletedCount: result.count };
    } catch (error) {
      console.error(`Error in EntityService.deleteMany(${entityName}):`, error);
      handlePrismaError(error);
    }
  }
}

export default new EntityService();
