import { StatusCodes } from "http-status-codes";
import { PortfolioService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class PortfolioController {
  async createPortfolioItem(req, res) {
    try {
      const response = await PortfolioService.createPortfolioItem(req.body);
      SuccessResponse.message = "Portfolio item created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create portfolio item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllPortfolioItems(req, res) {
    try {
      const response = await PortfolioService.getAllPortfolioItems(req.query);
      SuccessResponse.message = "Portfolio items retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve portfolio items";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getPortfolioItemById(req, res) {
    try {
      const response = await PortfolioService.getPortfolioItemById(req.params.id);
      SuccessResponse.message = "Portfolio item retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve portfolio item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updatePortfolioItem(req, res) {
    try {
      const response = await PortfolioService.updatePortfolioItem(req.params.id, req.body);
      SuccessResponse.message = "Portfolio item updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update portfolio item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deletePortfolioItem(req, res) {
    try {
      const response = await PortfolioService.deletePortfolioItem(req.params.id);
      SuccessResponse.message = "Portfolio item deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete portfolio item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new PortfolioController();

