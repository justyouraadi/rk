import { StatusCodes } from "http-status-codes";
import { AdminService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class AdminController {
  async createAdmin(req, res) {
    try {
      const response = await AdminService.createAdmin({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
        role: req.body.role,
        profilePicture: req.body.profilePicture,
        settings: req.body.settings,
      });
      SuccessResponse.message = "Admin created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create admin";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async loginAdmin(req, res) {
    try {
      const response = await AdminService.loginAdmin({
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
      });
      SuccessResponse.message = "Admin logged in successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to login admin";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllAdmins(req, res) {
    try {
      const response = await AdminService.getAllAdmins(req.query);
      SuccessResponse.message = "Admins retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve admins";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAdminById(req, res) {
    try {
      const adminId = req.params.id;
      const response = await AdminService.getAdminById(adminId);
      SuccessResponse.message = "Admin retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve admin";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getProfile(req, res) {
    try {
      const adminId = req.admin?.id;
      const response = await AdminService.getAdminById(adminId);
      SuccessResponse.message = "Admin profile retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve admin profile";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateProfile(req, res) {
    try {
      const adminId = req.admin?.id;
      const response = await AdminService.updateAdmin(adminId, req.body);
      SuccessResponse.message = "Admin profile updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update admin profile";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateAdmin(req, res) {
    try {
      const adminId = req.params.id;
      const response = await AdminService.updateAdmin(adminId, req.body);
      SuccessResponse.message = "Admin updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update admin";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async testEmail(req, res) {
    try {
      const { EmailService } = await import("../services/index.js");
      const recipient = req.body.email || process.env.SMTP_USER || "noreply@rkprinter.in";
      const result = await EmailService.sendTestEmail(recipient);
      SuccessResponse.message = "Test email sent successfully";
      SuccessResponse.data = result;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to send test email";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async resetAdminPassword(req, res) {
    try {
      const adminId = req.params.id;
      const response = await AdminService.resetAdminPassword({
        adminId,
        newPassword: req.body.newPassword,
      });
      SuccessResponse.message = "Admin password reset successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to reset admin password";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new AdminController();
