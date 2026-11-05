import express from "express";
import { IndustryController } from "../../controllers/index.js";

const router = express.Router();

router.get("/", IndustryController.getAllIndustries);
router.post("/", IndustryController.createIndustry);
router.get("/:id", IndustryController.getIndustryById);
router.put("/:id", IndustryController.updateIndustry);
router.patch("/:id", IndustryController.updateIndustry);
router.delete("/:id", IndustryController.deleteIndustry);

export default router;

