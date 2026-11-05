import { prisma } from "../config/index.js";
import AppError from "../utils/app.error.js";
import { handlePrismaError } from "../utils/prisma-error.handler.js";
import { StatusCodes } from "http-status-codes";
import EmailService from "./email.service.js";

function normalizeLeadOutput(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    created_date: item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date(item.createdAt).toISOString(),
    updated_date: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date(item.updatedAt).toISOString(),
  };
}

class LeadService {
  async createLead(params) {
    try {
      if (!params.name || !params.phone) {
        throw new AppError(["Name and phone are required for lead"], StatusCodes.BAD_REQUEST);
      }
      const data = { ...params };
      if (!data.id || String(data.id).startsWith("local-")) delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      if (data.delivery_date && !data.expected_date) {
        data.expected_date = data.delivery_date;
      }
      delete data.delivery_date;

      if (data.file_urls && Array.isArray(data.file_urls) && data.file_urls.length > 0) {
        const fileNotes = data.file_urls.map((u) => ({ note: `Attached File: ${u}`, date: new Date().toISOString() }));
        data.notes = Array.isArray(data.notes) ? [...data.notes, ...fileNotes] : fileNotes;
      }
      delete data.file_urls;

      if (data.additional_requirements) {
        data.requirement = data.requirement
          ? `${data.requirement}\nAdditional Requirements: ${data.additional_requirements}`
          : data.additional_requirements;
      }
      delete data.additional_requirements;
      delete data.quality;
      delete data.gsm;

      const allowedFields = [
        "lead_id", "name", "phone", "whatsapp", "email", "business_name",
        "location", "requirement", "service", "product", "product_id",
        "industry", "category", "variant", "quantity", "size", "material",
        "finishing", "expected_date", "status", "source", "priority",
        "notes", "estimated_value", "assigned_to", "customer_id",
      ];
      const cleanData = {};
      for (const k of allowedFields) {
        if (data[k] !== undefined) cleanData[k] = data[k];
      }

      const lead = await prisma.lead.create({ data: cleanData });

      if (cleanData.email) {
        EmailService.sendLeadConfirmationCustomer({
          to: cleanData.email,
          name: cleanData.name,
          leadId: lead.lead_id || lead.id,
          serviceNeeded: cleanData.service || cleanData.product || cleanData.requirement || "Custom Printing",
          quantity: cleanData.quantity || "-",
        }).catch((err) => {
          console.error("[LeadService] Failed to send customer lead confirmation email:", err.message);
        });
      }

      EmailService.sendLeadAlertAdmin({
        leadId: lead.lead_id || lead.id,
        name: cleanData.name,
        phone: cleanData.phone,
        email: cleanData.email,
        businessName: cleanData.business_name,
        requirements: cleanData.requirement || cleanData.service || cleanData.product,
        totalEstimate: cleanData.estimated_value,
      }).catch((err) => {
        console.error("[LeadService] Failed to send admin lead alert email:", err.message);
      });

      return normalizeLeadOutput(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      handlePrismaError(error);
    }
  }

  async getAllLeads(query = {}) {
    try {
      const { page, limit, sort, sortBy = "createdAt", sortOrder = "desc", status, source, search, phone } = query;
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: String(search) } },
          { phone: { contains: String(search) } },
          { email: { contains: String(search) } },
          { business_name: { contains: String(search) } },
          { requirement: { contains: String(search) } },
        ];
      }
      if (status) where.status = status;
      if (source) where.source = source;
      if (phone) where.phone = { contains: String(phone) };

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

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({ where, orderBy, take, skip }),
        prisma.lead.count({ where }),
      ]);

      return {
        items: leads.map(normalizeLeadOutput),
        total,
        page: page ? parseInt(page, 10) : 1,
        limit: take || total,
      };
    } catch (error) {
      console.error("Error fetching leads:", error);
      handlePrismaError(error);
    }
  }

  async getLeadById(id) {
    try {
      if (!id) throw new AppError(["Lead ID is required"], StatusCodes.BAD_REQUEST);

      const lead = await prisma.lead.findUnique({ where: { id } });
      if (!lead) throw new AppError(["Lead not found"], StatusCodes.NOT_FOUND);

      return normalizeLeadOutput(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      handlePrismaError(error);
    }
  }

  async updateLead(id, params) {
    try {
      if (!id) throw new AppError(["Lead ID is required for update"], StatusCodes.BAD_REQUEST);
      const data = { ...params };
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.created_date;
      delete data.updated_date;

      const lead = await prisma.lead.update({ where: { id }, data });
      return normalizeLeadOutput(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      handlePrismaError(error);
    }
  }

  async deleteLead(id) {
    try {
      if (!id) throw new AppError(["Lead ID is required for delete"], StatusCodes.BAD_REQUEST);
      await prisma.lead.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      console.error("Error deleting lead:", error);
      handlePrismaError(error);
    }
  }
}

export default new LeadService();

