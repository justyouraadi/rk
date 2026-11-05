import express from "express";
import { LeadController } from "../../controllers/index.js";

const router = express.Router();

router.get("/", LeadController.getAllLeads);
router.post("/", LeadController.createLead);
router.get("/:id", LeadController.getLeadById);
router.put("/:id", LeadController.updateLead);
router.patch("/:id", LeadController.updateLead);
router.delete("/:id", LeadController.deleteLead);

export default router;

