import { StatusCodes } from "http-status-codes";
import { ImportJobService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class ImportJobController {
  async createImportJob(req, res) {
    try {
      const response = await ImportJobService.createImportJob(req.body);
      SuccessResponse.message = "Import job created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create import job";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllImportJobs(req, res) {
    try {
      const response = await ImportJobService.getAllImportJobs(req.query);
      SuccessResponse.message = "Import jobs retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve import jobs";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getImportJobById(req, res) {
    try {
      const response = await ImportJobService.getImportJobById(req.params.id);
      SuccessResponse.message = "Import job retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve import job";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateImportJob(req, res) {
    try {
      const response = await ImportJobService.updateImportJob(req.params.id, req.body);
      SuccessResponse.message = "Import job updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update import job";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteImportJob(req, res) {
    try {
      const response = await ImportJobService.deleteImportJob(req.params.id);
      SuccessResponse.message = "Import job deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete import job";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new ImportJobController();

