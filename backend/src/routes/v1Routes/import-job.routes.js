import { Router } from "express";
import { ImportJobController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", ImportJobController.getAllImportJobs);
router.post("/", ImportJobController.createImportJob);
router.get("/:id", ImportJobController.getImportJobById);
router.put("/:id", ImportJobController.updateImportJob);
router.patch("/:id", ImportJobController.updateImportJob);
router.delete("/:id", authenticateUser, ImportJobController.deleteImportJob);

export default router;

