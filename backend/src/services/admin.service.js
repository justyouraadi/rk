import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { prisma } from "../config/index.js";
import { Utility } from "../utils/index.js";
import AppError from "../utils/app.error.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import EmailService from "./email.service.js";

class AdminService {
  async createAdmin(params) {
    try {
      if (!params.email || !params.password) {
        throw new AppError(
          ["Email and password are required"],
          StatusCodes.BAD_REQUEST,
        );
      }

      const hashedPassword = await bcrypt.hash(params.password, 10);
      const admin = await prisma.admin.create({
        data: {
          name: params.name,
          email: params.email,
          phone: params.phone,
          password: hashedPassword,
          role: params.role || "ADMIN",
          profilePicture: params.profilePicture,
          settings: params.settings || {},
        },
      });

      const jwt = await Utility.generateJWT({
        id: admin.id,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        type: "ADMIN",
      });

      return {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          status: admin.status,
          settings: admin.settings,
          whatsapp_settings: admin.settings?.whatsapp_settings || null,
          createdAt: admin.createdAt,
        },
        jwt,
      };
    } catch (error) {
      console.error("Error creating admin:", error);
      handlePrismaError(error);
    }
  }

  async loginAdmin(params) {
    try {
      if (!params.password || (!params.email && !params.phone)) {
        throw new AppError(
          ["Email/Phone and password are required"],
          StatusCodes.BAD_REQUEST,
        );
      }

      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            ...(params.email ? [{ email: params.email }] : []),
            ...(params.phone ? [{ phone: params.phone }] : []),
          ],
        },
      });

      if (!admin) {
        throw new AppError(["Admin not found"], StatusCodes.NOT_FOUND);
      }

      if (!admin.status) {
        throw new AppError(["Admin account is inactive"], StatusCodes.FORBIDDEN);
      }

      const isPasswordValid = await bcrypt.compare(
        params.password,
        admin.password,
      );

      if (!isPasswordValid) {
        throw new AppError(["Invalid password"], StatusCodes.UNAUTHORIZED);
      }

      const jwt = await Utility.generateJWT({
        id: admin.id,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        type: "ADMIN",
      });

      return {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          status: admin.status,
          settings: admin.settings,
          whatsapp_settings: admin.settings?.whatsapp_settings || null,
          createdAt: admin.createdAt,
        },
        jwt,
      };
    } catch (error) {
      console.error("Error logging in admin:", error);
      handlePrismaError(error);
    }
  }

  async getAllAdmins({
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    name,
    email,
    role,
    status,
  } = {}) {
    try {
      page = parseInt(page, 10);
      limit = parseInt(limit, 10);
      const skip = (page - 1) * limit;
      const take = limit;

      const where = {};

      if (name) {
        where.name = { contains: name };
      }

      if (email) {
        where.email = { contains: email };
      }

      if (role) {
        where.role = role;
      }

      if (status !== undefined && status !== "") {
        where.status = status === "true" || status === true;
      }

      const orderBy = {};
      orderBy[sortBy] = sortOrder;

      const [admins, total] = await Promise.all([
        prisma.admin.findMany({
          skip,
          take,
          where,
          orderBy,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            profilePicture: true,
            settings: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.admin.count({ where }),
      ]);

      const formatted = admins.map((a) => ({
        ...a,
        whatsapp_settings: a.settings?.whatsapp_settings || null,
      }));

      return {
        admins: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching admins:", error);
      handlePrismaError(error);
    }
  }

  async getAdminById(adminId) {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          profilePicture: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!admin) {
        throw new AppError(["Admin not found"], StatusCodes.NOT_FOUND);
      }

      return {
        ...admin,
        whatsapp_settings: admin.settings?.whatsapp_settings || null,
      };
    } catch (error) {
      console.error("Error fetching admin:", error);
      handlePrismaError(error);
    }
  }

  async updateAdmin(adminId, data) {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });
      if (!admin) {
        throw new AppError(["Admin not found"], StatusCodes.NOT_FOUND);
      }

      const updateData = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
      if (data.settings !== undefined) updateData.settings = data.settings;
      if (data.whatsapp_settings !== undefined) {
        const currentSettings = admin.settings && typeof admin.settings === "object" ? admin.settings : {};
        updateData.settings = { ...currentSettings, whatsapp_settings: data.whatsapp_settings };
      }

      const updated = await prisma.admin.update({
        where: { id: adminId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          profilePicture: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        ...updated,
        whatsapp_settings: updated.settings?.whatsapp_settings || null,
      };
    } catch (error) {
      console.error("Error updating admin:", error);
      handlePrismaError(error);
    }
  }

  async resetAdminPassword(params) {
    try {
      if (!params.newPassword) {
        throw new AppError(["New password is required"], StatusCodes.BAD_REQUEST);
      }

      const admin = await prisma.admin.findUnique({
        where: { id: params.adminId },
      });

      if (!admin) {
        throw new AppError(["Admin not found"], StatusCodes.NOT_FOUND);
      }

      const hashedPassword = await bcrypt.hash(params.newPassword, 10);
      await prisma.admin.update({
        where: { id: params.adminId },
        data: { password: hashedPassword },
      });

      if (admin.email) {
        EmailService.sendMail({
          to: admin.email,
          subject: "Your RK Printers Admin Password Was Reset",
          html: `<p>Hello ${admin.name || "Admin"},</p><p>Your admin password for <strong>RK Printers</strong> was successfully reset. If you did not make this change, please contact system administration immediately.</p>`,
        }).catch((err) => {
          console.error("[AdminService] Failed to send admin password reset email:", err.message);
        });
      }

      return { id: params.adminId };
    } catch (error) {
      console.error("Error resetting admin password:", error);
      handlePrismaError(error);
    }
  }

  async isAuthenticated(token) {
    try {
      const response = await Utility.verifyJWT(token);
      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            ...(response.id ? [{ id: response.id }] : []),
            ...(response.email ? [{ email: response.email }] : []),
          ],
        },
      });

      if (!admin) {
        throw new AppError(["Admin not found"], StatusCodes.NOT_FOUND);
      }

      if (!admin.status) {
        throw new AppError(["Admin account is inactive"], StatusCodes.FORBIDDEN);
      }

      return admin;
    } catch (error) {
      console.error("Error verifying admin JWT:", error);
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        throw new AppError(
          [
            error.name === "JsonWebTokenError"
              ? "Invalid token"
              : "Token expired",
          ],
          StatusCodes.UNAUTHORIZED,
        );
      }
      handlePrismaError(error);
    }
  }
}

export default new AdminService();
