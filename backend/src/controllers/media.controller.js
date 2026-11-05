import { StatusCodes } from "http-status-codes";
import { MediaService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class MediaController {
  async createMediaItem(req, res) {
    try {
      const response = await MediaService.createMediaItem(req.body);
      SuccessResponse.message = "Media item created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create media item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllMediaItems(req, res) {
    try {
      const response = await MediaService.getAllMediaItems(req.query);
      SuccessResponse.message = "Media items retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve media items";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getMediaItemById(req, res) {
    try {
      const response = await MediaService.getMediaItemById(req.params.id);
      SuccessResponse.message = "Media item retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve media item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateMediaItem(req, res) {
    try {
      const response = await MediaService.updateMediaItem(req.params.id, req.body);
      SuccessResponse.message = "Media item updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update media item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteMediaItem(req, res) {
    try {
      const response = await MediaService.deleteMediaItem(req.params.id);
      SuccessResponse.message = "Media item deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete media item";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new MediaController();

