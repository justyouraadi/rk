import { StatusCodes } from "http-status-codes";
import { EntityService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class EntityController {
  resolveEntity(req) {
    return req.params.entity || req.baseUrl.split("/").pop();
  }

  async list(req, res) {
    try {
      const entity = req.params.entity || req.baseUrl.split("/").pop();
      const response = await EntityService.list(entity, req.query);
      SuccessResponse.message = `${entity} retrieved successfully`;
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve items";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async get(req, res) {
    try {
      const entity = req.params.entity || req.baseUrl.split("/").pop();
      const idOrSlug = req.params.id;
      const response = await EntityService.get(entity, idOrSlug);
      SuccessResponse.message = `${entity} retrieved successfully`;
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async create(req, res) {
    try {
      const entity = req.params.entity || req.baseUrl.split("/").pop();
      const response = await EntityService.create(entity, req.body);
      SuccessResponse.message = `${entity} created successfully`;
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async update(req, res) {
    try {
      const entity = req.params.entity || req.baseUrl.split("/").pop();
      const id = req.params.id;
      const response = await EntityService.update(entity, id, req.body);
      SuccessResponse.message = `${entity} updated successfully`;
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async delete(req, res) {
    try {
      const entity = req.params.entity || req.baseUrl.split("/").pop();
      const id = req.params.id;
      const response = await EntityService.delete(entity, id);
      SuccessResponse.message = `${entity} deleted successfully`;
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async bulkUpdate(req, res) {
    try {
      const entity = req.params.entity || req.baseUrl.split("/").pop();
      const items = req.body.items || req.body;
      const response = await EntityService.bulkUpdate(entity, items);
      SuccessResponse.message = `${entity} bulk updated successfully`;
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to bulk update items";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteMany(req, res) {
    try {
      const entity = req.params.entity || req.baseUrl.split("/").pop();
      const ids = req.body.ids || req.body;
      const response = await EntityService.deleteMany(entity, ids);
      SuccessResponse.message = `${entity} deleted successfully`;
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete items";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new EntityController();

