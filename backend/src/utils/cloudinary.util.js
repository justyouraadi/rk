import { Readable } from "node:stream";
import { cloudinary } from "../config/index.js";
import AppError from "./app.error.js";
import { StatusCodes } from "http-status-codes";

/**
 * Upload a memory buffer (e.g. from multer) directly to Cloudinary
 * Supports images, videos, audio, PDFs, and all raw documents.
 */
export const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new AppError(["No buffer provided for upload"], StatusCodes.BAD_REQUEST));
    }

    let settled = false;
    const timeoutDuration = options.timeout || 25000;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new AppError(["Cloudinary upload timed out after " + Math.round(timeoutDuration / 1000) + "s"], StatusCodes.GATEWAY_TIMEOUT));
      }
    }, timeoutDuration);

    const safeReject = (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    };

    const safeResolve = (res) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(res);
      }
    };

    const uploadOptions = {
      folder: options.folder || "rk-printers/uploads",
      resource_type: options.resource_type || "auto",
      ...(options.public_id && { public_id: options.public_id }),
      ...(options.transformation && { transformation: options.transformation }),
      ...(options.allowed_formats && { allowed_formats: options.allowed_formats }),
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload_stream error:", error);
          return safeReject(
            new AppError(
              [error.message || "Failed to upload file to Cloudinary"],
              StatusCodes.INTERNAL_SERVER_ERROR
            )
          );
        }

        safeResolve({
          url: result.secure_url || result.url,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          bytes: result.bytes,
          width: result.width || null,
          height: result.height || null,
          duration: result.duration || null,
          created_at: result.created_at,
          original_filename: result.original_filename,
        });
      }
    );

    uploadStream.on("error", (err) => {
      console.error("Cloudinary stream error event:", err);
      safeReject(
        new AppError(
          [err.message || "Cloudinary stream connection error"],
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    });

    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Upload a local file path, remote URL, or base64 Data URI to Cloudinary
 */
export const uploadFileOrUrlToCloudinary = async (fileOrUrl, options = {}) => {
  try {
    if (!fileOrUrl) {
      throw new AppError(["File or URL required for upload"], StatusCodes.BAD_REQUEST);
    }

    const uploadOptions = {
      folder: options.folder || "rk-printers/uploads",
      resource_type: options.resource_type || "auto",
      ...(options.public_id && { public_id: options.public_id }),
      ...(options.transformation && { transformation: options.transformation }),
    };

    const result = await cloudinary.uploader.upload(fileOrUrl, uploadOptions);

    return {
      url: result.secure_url || result.url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width || null,
      height: result.height || null,
      duration: result.duration || null,
      created_at: result.created_at,
      original_filename: result.original_filename,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      [error.message || "Failed to upload file to Cloudinary"],
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Delete an asset from Cloudinary by public_id
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) {
      throw new AppError(["Public ID is required to delete asset"], StatusCodes.BAD_REQUEST);
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      [error.message || "Failed to delete file from Cloudinary"],
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

