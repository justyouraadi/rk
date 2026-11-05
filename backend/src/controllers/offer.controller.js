import { StatusCodes } from "http-status-codes";
import { OfferService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class OfferController {
  async createOffer(req, res) {
    try {
      const response = await OfferService.createOffer(req.body);
      SuccessResponse.message = "Offer created successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to create offer";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getAllOffers(req, res) {
    try {
      const response = await OfferService.getAllOffers(req.query);
      SuccessResponse.message = "Offers retrieved successfully";
      SuccessResponse.data = response.items;
      SuccessResponse.meta = {
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve offers";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async getOfferById(req, res) {
    try {
      const response = await OfferService.getOfferById(req.params.id);
      SuccessResponse.message = "Offer retrieved successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to retrieve offer";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async updateOffer(req, res) {
    try {
      const response = await OfferService.updateOffer(req.params.id, req.body);
      SuccessResponse.message = "Offer updated successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to update offer";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteOffer(req, res) {
    try {
      const response = await OfferService.deleteOffer(req.params.id);
      SuccessResponse.message = "Offer deleted successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete offer";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new OfferController();

