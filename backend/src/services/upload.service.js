import fs from "fs";
import path from "path";
import {
  uploadBufferToCloudinary,
  uploadFileOrUrlToCloudinary,
  deleteFromCloudinary,
  AppError,
} from "../utils/index.js";
import { StatusCodes } from "http-status-codes";

class UploadService {
  /**
   * Save a buffer directly to local storage (resilient fallback)
   */
  async saveToLocalDisk(buffer, originalname, folder = "uploads") {
    try {
      const sanitizedName = (originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      await fs.promises.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      const port = process.env.PORT || 3000;
      const baseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;
      const fileUrl = `${baseUrl}/uploads/files/${filename}`;

      console.log(`[UploadService] File stored locally at ${fileUrl}`);
      return {
        url: fileUrl,
        secure_url: fileUrl,
        public_id: `local/${filename}`,
        original_name: originalname || null,
        storage: "local",
      };
    } catch (err) {
      console.error("[UploadService] Local disk fallback failed:", err);
      throw err;
    }
  }

  /**
   * Upload a single file (multer file object or base64 / URL string) to Cloudinary with local fallback
   */
  async uploadSingle(params) {
    const { file, folder = "rk-printers/uploads", publicId } = params;

    if (!file) {
      throw new AppError(["No file provided for upload"], StatusCodes.BAD_REQUEST);
    }

    // If file came through Multer (has buffer)
    if (file.buffer) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const rawExtensions = [".pdf", ".ai", ".cdr", ".psd", ".zip", ".rar", ".7z", ".doc", ".docx", ".eps", ".tar", ".gz"];
      const isRaw = rawExtensions.includes(ext) || file.mimetype === "application/pdf" || file.mimetype?.startsWith("application/");
      const detectedResourceType = isRaw ? "raw" : (file.mimetype?.startsWith("image/") ? "image" : "auto");

      const sanitizedName = (file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      const computedPublicId = publicId || (isRaw ? `${folder}/${Date.now()}-${sanitizedName}` : undefined);

      try {
        const result = await uploadBufferToCloudinary(file.buffer, {
          folder,
          resource_type: detectedResourceType,
          public_id: computedPublicId,
          timeout: 20000,
        });

        return {
          ...result,
          original_name: file.originalname || null,
          mimetype: file.mimetype || null,
          storage: "cloudinary",
        };
      } catch (cloudErr) {
        console.warn(`[UploadService] Cloudinary upload failed (${cloudErr.message}), using local disk fallback...`);
        const localRes = await this.saveToLocalDisk(file.buffer, file.originalname, folder);
        return {
          ...localRes,
          mimetype: file.mimetype || null,
          bytes: file.size || file.buffer.length,
        };
      }
    }

    // If file is passed as a string (URL or base64 Data URI)
    if (typeof file === "string") {
      try {
        const result = await uploadFileOrUrlToCloudinary(file, {
          folder,
          resource_type: params.resourceType || "auto",
          public_id: publicId,
        });
        return result;
      } catch (cloudErr) {
        console.error("Cloudinary URL upload failed:", cloudErr);
        throw new AppError([cloudErr.message || "Failed to upload URL"], StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }

    throw new AppError(["Unsupported file format"], StatusCodes.BAD_REQUEST);
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

