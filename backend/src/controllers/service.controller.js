import { StatusCodes } from "http-status-codes";
import { ServiceService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class ServiceController {
  async createService(req, res) {
    try {
      const response = await ServiceService.createService(req.body);
      SuccessResponse.message = "Service created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create service";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllServices(req, res) {
    try {
      const response = await ServiceService.getAllServices(req.query);
      SuccessResponse.message = "Services retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve services";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getServiceById(req, res) {
    try {
      const response = await ServiceService.getServiceById(req.params.id);
      SuccessResponse.message = "Service retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve service";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateService(req, res) {
    try {
      const response = await ServiceService.updateService(req.params.id, req.body);
      SuccessResponse.message = "Service updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update service";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteService(req, res) {
    try {
      const response = await ServiceService.deleteService(req.params.id);
      SuccessResponse.message = "Service deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete service";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new ServiceController();

