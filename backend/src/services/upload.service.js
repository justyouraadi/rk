import {
  uploadBufferToCloudinary,
  uploadFileOrUrlToCloudinary,
  deleteFromCloudinary,
  AppError,
} from "../utils/index.js";
import { StatusCodes } from "http-status-codes";

class UploadService {
  /**
   * Upload a single file (multer file object or base64 / URL string) to Cloudinary
   */
  async uploadSingle(params) {
    try {
      const { file, folder = "rk-printers/uploads", resourceType = "auto", publicId } = params;

      if (!file) {
        throw new AppError(["No file provided for upload"], StatusCodes.BAD_REQUEST);
      }

      // If file came through Multer (has buffer)
      if (file.buffer) {
        const result = await uploadBufferToCloudinary(file.buffer, {
          folder,
          resource_type: resourceType,
          public_id: publicId,
        });

        return {
          ...result,
          original_name: file.originalname || null,
          mimetype: file.mimetype || null,
        };
      }

      // If file is passed as a string (URL or base64 Data URI)
      if (typeof file === "string") {
        const result = await uploadFileOrUrlToCloudinary(file, {
          folder,
          resource_type: resourceType,
          public_id: publicId,
        });

        return result;
      }

      throw new AppError(["Unsupported file format"], StatusCodes.BAD_REQUEST);
    } catch (error) {
      console.error("Error in UploadService.uploadSingle:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        [error.message || "Failed to upload file to Cloudinary"],
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Upload multiple files to Cloudinary in parallel
   */
  async uploadMultiple(params) {
    try {
      const { files, folder = "rk-printers/uploads", resourceType = "auto" } = params;

      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new AppError(["No files provided for upload"], StatusCodes.BAD_REQUEST);
      }

      const uploadPromises = files.map((file) =>
        this.uploadSingle({ file, folder, resourceType })
      );

      const results = await Promise.all(uploadPromises);

      return {
        count: results.length,
        files: results,
      };
    } catch (error) {
      console.error("Error in UploadService.uploadMultiple:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        [error.message || "Failed to upload multiple files to Cloudinary"],
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a file from Cloudinary by public ID
   */
  async deleteFile(params) {
    try {
      const { publicId, resourceType = "image" } = params;

      if (!publicId) {
        throw new AppError(["publicId is required"], StatusCodes.BAD_REQUEST);
      }

      const result = await deleteFromCloudinary(publicId, resourceType);

      return {
        publicId,
        result: result.result || "ok",
      };
    } catch (error) {
      console.error("Error in UploadService.deleteFile:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        [error.message || "Failed to delete file from Cloudinary"],
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export default new UploadService();

