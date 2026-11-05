import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../utils/index.js";

// Memory storage keeps files in memory as Buffers so they can be streamed directly to Cloudinary
const storage = multer.memoryStorage();

// 50MB maximum file size limit
const limits = {
  fileSize: 50 * 1024 * 1024,
};

const upload = multer({
  storage,
  limits,
});

/**
 * Middleware factory for a single file upload with standard error handling
 */
export const uploadSingleFile = (fieldName = "file") => {
  const middleware = upload.single(fieldName);
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          ErrorResponse.message = "File too large";
          ErrorResponse.error = { explanation: "Maximum file size allowed is 50MB" };
          return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
        }
        ErrorResponse.message = "File upload failed";
        ErrorResponse.error = { explanation: err.message || "Failed to process uploaded file" };
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      }
      next();
    });
  };
};

/**
 * Middleware factory for multiple file uploads with standard error handling
 */
export const uploadMultipleFiles = (fieldName = "files", maxCount = 10) => {
  const middleware = upload.array(fieldName, maxCount);
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          ErrorResponse.message = "File too large";
          ErrorResponse.error = { explanation: "Maximum file size allowed is 50MB per file" };
          return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          ErrorResponse.message = "Too many files";
          ErrorResponse.error = { explanation: `Maximum of ${maxCount} files allowed` };
          return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
        }
        ErrorResponse.message = "Files upload failed";
        ErrorResponse.error = { explanation: err.message || "Failed to process uploaded files" };
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      }
      next();
    });
  };
};

export default {
  uploadSingleFile,
  uploadMultipleFiles,
};

