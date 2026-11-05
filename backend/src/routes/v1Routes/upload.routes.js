import express from "express";
import { UploadController } from "../../controllers/index.js";
import { uploadSingleFile, uploadMultipleFiles } from "../../middlewares/index.js";

const router = express.Router();

// Upload a single file (image, video, raw document, etc.)
router.post("/single", uploadSingleFile("file"), UploadController.uploadSingle);

// Upload multiple files (up to 10 files)
router.post("/multiple", uploadMultipleFiles("files", 10), UploadController.uploadMultiple);

// Delete an asset from Cloudinary by publicId
router.delete("/", UploadController.deleteFile);

export default router;

