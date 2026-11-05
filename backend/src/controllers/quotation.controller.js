import { StatusCodes } from "http-status-codes";
import { QuotationService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class QuotationController {
  async createQuotation(req, res) {
    try {
      const response = await QuotationService.createQuotation(req.body);
      SuccessResponse.message = "Quotation created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create quotation";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllQuotations(req, res) {
    try {
      const response = await QuotationService.getAllQuotations(req.query);
      SuccessResponse.message = "Quotations retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve quotations";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getQuotationById(req, res) {
    try {
      const response = await QuotationService.getQuotationById(req.params.id);
      SuccessResponse.message = "Quotation retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve quotation";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateQuotation(req, res) {
    try {
      const response = await QuotationService.updateQuotation(req.params.id, req.body);
      SuccessResponse.message = "Quotation updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update quotation";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteQuotation(req, res) {
    try {
      const response = await QuotationService.deleteQuotation(req.params.id);
      SuccessResponse.message = "Quotation deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete quotation";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new QuotationController();

