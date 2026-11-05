import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";

function normalizeNotificationOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class NotificationService {
  async createNotification(params) {
    try {
      if (!params.title || !params.message) {
        throw new AppError(["Title and message are required"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.is_read !== undefined) data.is_read = Boolean(data.is_read);

      if (data.link) {
        data.metadata = { ...(typeof data.metadata === "object" ? data.metadata : {}), link: data.link };
        delete data.link;
      }

      const allowedFields = ["title", "message", "type", "audience", "is_read", "metadata"];
      const cleanData = {};
      for (const key of allowedFields) {
        if (data[key] !== undefined) cleanData[key] = data[key];
      }

      const notification = await prisma.notification.create({ data: cleanData });
      return normalizeNotificationOutput(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      handlePrismaError(error);
    }
  }

  async getAllNotifications(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", type, audience = "ADMIN", is_read } = query;
      const where = {};

      if (type) where.type = type;
      if (audience) where.audience = audience;
      if (is_read !== undefined && is_read !== "") {
        where.is_read = is_read === "true" || is_read === true;
      }

      const orderBy = {};
      const actualSortBy = sortBy || (sort && sort.replace(/^-/, "")) || "createdAt";
      const actualSortOrder = sortOrder || (sort && sort.startsWith("-") ? "desc" : "asc") || "desc";
      orderBy[actualSortBy] = actualSortOrder;

      const take = limit ? parseInt(limit, 10) : undefined;
      const skip = page && limit ? (parseInt(page, 10) - 1) * take : undefined;

      const [items, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy,
          take,
          skip,
        }),
        prisma.notification.count({ where }),
      ]);

      return {
        items: items.map(normalizeNotificationOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error retrieving notifications:", error);
      handlePrismaError(error);
    }
  }

  async getNotificationById(id) {
    try {
      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification) {
        throw new AppError(["Notification not found"], StatusCodes.NOT_FOUND);
      }
      return normalizeNotificationOutput(notification);
    } catch (error) {
      console.error("Error retrieving notification:", error);
      handlePrismaError(error);
    }
  }

  async markAsRead(id) {
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: { is_read: true },
      });
      return normalizeNotificationOutput(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      handlePrismaError(error);
    }
  }

  async markAllAsRead(audience = "ADMIN") {
    try {
      await prisma.notification.updateMany({
        where: { audience, is_read: false },
        data: { is_read: true },
      });
      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      handlePrismaError(error);
    }
  }

  async updateNotification(id, params) {
    try {
      const existing = await prisma.notification.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Notification not found"], StatusCodes.NOT_FOUND);
      }

      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.is_read !== undefined) data.is_read = Boolean(data.is_read);

      const updated = await prisma.notification.update({
        where: { id },
        data,
      });
      return normalizeNotificationOutput(updated);
    } catch (error) {
      console.error("Error updating notification:", error);
      handlePrismaError(error);
    }
  }

  async deleteNotification(id) {
    try {
      const existing = await prisma.notification.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(["Notification not found"], StatusCodes.NOT_FOUND);
      }

      await prisma.notification.delete({ where: { id } });
      return { id };
    } catch (error) {
      console.error("Error deleting notification:", error);
      handlePrismaError(error);
    }
  }
}

export default new NotificationService();

