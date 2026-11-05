import { StatusCodes } from "http-status-codes";
import { UploadService } from "../services/index.js";
import { ErrorResponse, SuccessResponse } from "../utils/index.js";

class UploadController {
  async uploadSingle(req, res) {
    try {
      const file = req.file || req.body.file;
      const folder = req.body.folder || req.query.folder || "rk-printers/uploads";
      const resourceType = req.body.resourceType || req.query.resourceType || "auto";
      const publicId = req.body.publicId;

      const response = await UploadService.uploadSingle({
        file,
        folder,
        resourceType,
        publicId,
      });

      SuccessResponse.message = "File uploaded to Cloudinary successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to upload file";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async uploadMultiple(req, res) {
    try {
      const files = req.files || req.body.files;
      const folder = req.body.folder || req.query.folder || "rk-printers/uploads";
      const resourceType = req.body.resourceType || req.query.resourceType || "auto";

      const response = await UploadService.uploadMultiple({
        files,
        folder,
        resourceType,
      });

      SuccessResponse.message = "Files uploaded to Cloudinary successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to upload files";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }

  async deleteFile(req, res) {
    try {
      const publicId = req.body.publicId || req.query.publicId;
      const resourceType = req.body.resourceType || req.query.resourceType || "image";

      const response = await UploadService.deleteFile({
        publicId,
        resourceType,
      });

      SuccessResponse.message = "File deleted from Cloudinary successfully";
      SuccessResponse.data = response;
      return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
      ErrorResponse.message = "Failed to delete file";
      ErrorResponse.error = error;
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ErrorResponse);
    }
  }
}

export default new UploadController();

