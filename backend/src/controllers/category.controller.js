import { StatusCodes } from "http-status-codes";
import { CategoryService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class CategoryController {
  async createCategory(req, res) {
    try {
      const response = await CategoryService.createCategory(req.body);
      SuccessResponse.message = "Category created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create category";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllCategories(req, res) {
    try {
      const response = await CategoryService.getAllCategories(req.query);
      SuccessResponse.message = "Categories retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve categories";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getCategoryById(req, res) {
    try {
      const response = await CategoryService.getCategoryById(req.params.id);
      SuccessResponse.message = "Category retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve category";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateCategory(req, res) {
    try {
      const response = await CategoryService.updateCategory(req.params.id, req.body);
      SuccessResponse.message = "Category updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update category";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteCategory(req, res) {
    try {
      const response = await CategoryService.deleteCategory(req.params.id);
      SuccessResponse.message = "Category deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete category";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new CategoryController();

