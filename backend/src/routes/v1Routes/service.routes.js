import express from "express";
import { ServiceController } from "../../controllers/index.js";

const router = express.Router();

router.get("/", ServiceController.getAllServices);
router.post("/", ServiceController.createService);
router.get("/:id", ServiceController.getServiceById);
router.put("/:id", ServiceController.updateService);
router.patch("/:id", ServiceController.updateService);
router.delete("/:id", ServiceController.deleteService);

export default router;

