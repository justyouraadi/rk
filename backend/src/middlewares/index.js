import AuthMiddleware from "./auth.middleware.js";
import UploadMiddleware, {
  uploadSingleFile,
  uploadMultipleFiles,
} from "./upload.middleware.js";

export {
  AuthMiddleware,
  UploadMiddleware,
  uploadSingleFile,
  uploadMultipleFiles,
};
