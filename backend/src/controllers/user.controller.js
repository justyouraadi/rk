import { StatusCodes } from "http-status-codes";
import { UserService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class UserController {
  async createUser(req, res) {
    try {
      const response = await UserService.createUser({
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        company: req.body.company,
      });
      SuccessResponse.message = "User created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create user";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllUsers(req, res) {
    try {
      const response = await UserService.getAllUsers(req.query);
      SuccessResponse.message = "Users retrieved successfully";
      SuccessResponse.data = response.users;
      SuccessResponse.meta = response.pagination;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve users";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const response = await UserService.getProfile(userId);
      SuccessResponse.message = "User profile retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve user profile";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const response = await UserService.updateProfile(userId, req.body);
      SuccessResponse.message = "User profile updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update user profile";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getUserById(req, res) {
    try {
      const userId = req.params.id;
      const response = await UserService.getUserById(userId);
      SuccessResponse.message = "User retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve user";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async loginUser(req, res) {
    try {
      const response = await UserService.loginUser({
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
      });
      SuccessResponse.message = "User logged in successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to login user";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async forgotPassword(req, res) {
    try {
      const response = await UserService.forgotPassword(req.body.email);
      SuccessResponse.message = response.message;
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to process forgot password request";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async sendOtp(req, res) {
    try {
      const response = await UserService.sendOtp({
        email: req.body.email,
        purpose: req.body.purpose || "Verification",
      });
      SuccessResponse.message = response.message;
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to send OTP";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async testEmail(req, res) {
    try {
      const recipient = req.body.email || process.env.SMTP_USER;
      const response = await UserService.sendTestEmail(recipient);
      SuccessResponse.message = "Test email sent successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to send test email";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async resetPasswordWithToken(req, res) {
    try {
      const response = await UserService.resetPasswordWithToken({
        resetToken: req.body.resetToken,
        email: req.body.email,
        otpCode: req.body.otpCode,
        newPassword: req.body.newPassword,
      });
      SuccessResponse.message = response.message;
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to reset password";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async verifyOtp(req, res) {
    try {
      const response = await UserService.verifyOtp({
        email: req.body.email,
        otpCode: req.body.otpCode,
      });
      SuccessResponse.message = "OTP verified successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to verify OTP";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async resetUserPassword(req, res) {
    try {
      const userId = req.params.id;
      const response = await UserService.resetUserPassword({
        userId,
        newPassword: req.body.newPassword,
      });
      SuccessResponse.message = "User password reset successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to reset user password";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new UserController();
