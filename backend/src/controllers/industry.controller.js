import { StatusCodes } from "http-status-codes";
import { IndustryService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class IndustryController {
  async createIndustry(req, res) {
    try {
      const response = await IndustryService.createIndustry(req.body);
      SuccessResponse.message = "Industry created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create industry";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllIndustries(req, res) {
    try {
      const response = await IndustryService.getAllIndustries(req.query);
      SuccessResponse.message = "Industries retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve industries";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getIndustryById(req, res) {
    try {
      const response = await IndustryService.getIndustryById(req.params.id);
      SuccessResponse.message = "Industry retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve industry";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateIndustry(req, res) {
    try {
      const response = await IndustryService.updateIndustry(req.params.id, req.body);
      SuccessResponse.message = "Industry updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update industry";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteIndustry(req, res) {
    try {
      const response = await IndustryService.deleteIndustry(req.params.id);
      SuccessResponse.message = "Industry deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete industry";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new IndustryController();

