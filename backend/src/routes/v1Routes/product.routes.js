import express from "express";
import { ProductController } from "../../controllers/index.js";

const router = express.Router();

router.get("/", ProductController.getAllProducts);
router.post("/", ProductController.createProduct);
router.post("/bulk-update", ProductController.bulkUpdate);
router.post("/delete-many", ProductController.deleteMany);
router.get("/:id", ProductController.getProductById);
router.put("/:id", ProductController.updateProduct);
router.patch("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);

export default router;

