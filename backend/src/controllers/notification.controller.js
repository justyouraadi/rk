import { StatusCodes } from "http-status-codes";
import { NotificationService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class NotificationController {
  async createNotification(req, res) {
    try {
      const response = await NotificationService.createNotification(req.body);
      SuccessResponse.message = "Notification created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create notification";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllNotifications(req, res) {
    try {
      const response = await NotificationService.getAllNotifications(req.query);
      SuccessResponse.message = "Notifications retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve notifications";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getNotificationById(req, res) {
    try {
      const response = await NotificationService.getNotificationById(req.params.id);
      SuccessResponse.message = "Notification retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve notification";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async markAsRead(req, res) {
    try {
      const response = await NotificationService.markAsRead(req.params.id);
      SuccessResponse.message = "Notification marked as read";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to mark notification as read";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async markAllAsRead(req, res) {
    try {
      const audience = req.query.audience || "ADMIN";
      const response = await NotificationService.markAllAsRead(audience);
      SuccessResponse.message = "All notifications marked as read";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to mark all notifications as read";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateNotification(req, res) {
    try {
      const response = await NotificationService.updateNotification(req.params.id, req.body);
      SuccessResponse.message = "Notification updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update notification";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteNotification(req, res) {
    try {
      const response = await NotificationService.deleteNotification(req.params.id);
      SuccessResponse.message = "Notification deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete notification";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new NotificationController();

