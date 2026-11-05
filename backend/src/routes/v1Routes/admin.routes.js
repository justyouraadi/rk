import express from "express";
import { AdminController } from "../../controllers/index.js";
import { AuthMiddleware } from "../../middlewares/index.js";

const router = express.Router();

router.post("/signup", AdminController.createAdmin);
router.post("/login", AdminController.loginAdmin);
router.get("/profile", AuthMiddleware.authenticateAdmin, AdminController.getProfile);
router.put("/profile", AuthMiddleware.authenticateAdmin, AdminController.updateProfile);
router.patch("/profile", AuthMiddleware.authenticateAdmin, AdminController.updateProfile);
router.get("/", AuthMiddleware.authenticateAdmin, AdminController.getAllAdmins);
router.get("/:id", AuthMiddleware.authenticateAdmin, AdminController.getAdminById);
router.put("/:id", AuthMiddleware.authenticateAdmin, AdminController.updateAdmin);
router.patch("/:id", AuthMiddleware.authenticateAdmin, AdminController.updateAdmin);
router.post("/:id/reset-password", AuthMiddleware.authenticateAdmin, AdminController.resetAdminPassword);
router.post("/test-email", AuthMiddleware.authenticateAdmin, AdminController.testEmail);

export default router;
