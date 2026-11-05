import { Router } from "express";
import { NotificationController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", NotificationController.getAllNotifications);
router.post("/", NotificationController.createNotification);
router.post("/mark-all-read", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.get("/:id", NotificationController.getNotificationById);
router.put("/:id", NotificationController.updateNotification);
router.patch("/:id", NotificationController.updateNotification);
router.delete("/:id", authenticateUser, NotificationController.deleteNotification);

export default router;

