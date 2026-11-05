import { StatusCodes } from "http-status-codes";
import { CustomerService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class CustomerController {
  async createCustomer(req, res) {
    try {
      const response = await CustomerService.createCustomer(req.body);
      SuccessResponse.message = "Customer created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create customer";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllCustomers(req, res) {
    try {
      const response = await CustomerService.getAllCustomers(req.query);
      SuccessResponse.message = "Customers retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve customers";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getCustomerById(req, res) {
    try {
      const response = await CustomerService.getCustomerById(req.params.id);
      SuccessResponse.message = "Customer retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve customer";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateCustomer(req, res) {
    try {
      const response = await CustomerService.updateCustomer(req.params.id, req.body);
      SuccessResponse.message = "Customer updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update customer";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteCustomer(req, res) {
    try {
      const response = await CustomerService.deleteCustomer(req.params.id);
      SuccessResponse.message = "Customer deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete customer";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new CustomerController();

