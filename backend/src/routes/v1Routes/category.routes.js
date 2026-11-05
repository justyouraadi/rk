import express from "express";
import { CategoryController } from "../../controllers/index.js";

const router = express.Router();

router.get("/", CategoryController.getAllCategories);
router.post("/", CategoryController.createCategory);
router.get("/:id", CategoryController.getCategoryById);
router.put("/:id", CategoryController.updateCategory);
router.patch("/:id", CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

export default router;

