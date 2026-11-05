import { StatusCodes } from "http-status-codes";
import { OrderService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class OrderController {
  async createOrder(req, res) {
    try {
      const response = await OrderService.createOrder(req.body);
      SuccessResponse.message = "Order created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create order";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllOrders(req, res) {
    try {
      const response = await OrderService.getAllOrders(req.query);
      SuccessResponse.message = "Orders retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve orders";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async trackOrder(req, res) {
    try {
      const response = await OrderService.trackOrder(req.params.orderNumber);
      SuccessResponse.message = "Order tracking information retrieved";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to track order";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.NOT_FOUND)
        .json(ErrorResponse);
    }
  }

  async getOrderById(req, res) {
    try {
      const response = await OrderService.getOrderById(req.params.id);
      SuccessResponse.message = "Order retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve order";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateOrder(req, res) {
    try {
      const response = await OrderService.updateOrder(req.params.id, req.body);
      SuccessResponse.message = "Order updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update order";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteOrder(req, res) {
    try {
      const response = await OrderService.deleteOrder(req.params.id);
      SuccessResponse.message = "Order deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete order";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new OrderController();

