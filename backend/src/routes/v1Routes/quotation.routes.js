import express from "express";
import { QuotationController } from "../../controllers/index.js";

const router = express.Router();

router.get("/", QuotationController.getAllQuotations);
router.post("/", QuotationController.createQuotation);
router.get("/:id", QuotationController.getQuotationById);
router.put("/:id", QuotationController.updateQuotation);
router.patch("/:id", QuotationController.updateQuotation);
router.delete("/:id", QuotationController.deleteQuotation);

export default router;

