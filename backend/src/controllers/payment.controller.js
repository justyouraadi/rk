import { StatusCodes } from "http-status-codes";
import { PaymentService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class PaymentController {
  async createPayment(req, res) {
    try {
      const response = await PaymentService.createPayment(req.body);
      SuccessResponse.message = "Payment recorded successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to record payment";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllPayments(req, res) {
    try {
      const response = await PaymentService.getAllPayments(req.query);
      SuccessResponse.message = "Payments retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve payments";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getPaymentById(req, res) {
    try {
      const response = await PaymentService.getPaymentById(req.params.id);
      SuccessResponse.message = "Payment retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve payment";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updatePayment(req, res) {
    try {
      const response = await PaymentService.updatePayment(req.params.id, req.body);
      SuccessResponse.message = "Payment updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update payment";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deletePayment(req, res) {
    try {
      const response = await PaymentService.deletePayment(req.params.id);
      SuccessResponse.message = "Payment deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete payment";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async createRazorpayOrder(req, res) {
    try {
      const response = await PaymentService.createRazorpayOrder({
        ...req.body,
        user_id: req.user?.id || req.body?.user_id,
        customer_email: req.body?.customer_email || req.user?.email,
      });
      SuccessResponse.message = "Payment order created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = error.message || "Failed to create payment order";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async verifyRazorpayPayment(req, res) {
    try {
      const response = await PaymentService.verifyRazorpayPayment({
        ...req.body,
        user_id: req.user?.id || req.body?.user_id,
      });
      SuccessResponse.message = "Payment verified successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = error.message || "Failed to verify payment";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.BAD_REQUEST)
        .json(ErrorResponse);
    }
  }
}

export default new PaymentController();

