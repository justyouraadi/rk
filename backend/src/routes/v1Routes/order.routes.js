import { Router } from "express";
import { OrderController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/track/:orderNumber", OrderController.trackOrder);
router.get("/", OrderController.getAllOrders);
router.post("/", OrderController.createOrder);
router.get("/:id", OrderController.getOrderById);
router.put("/:id", OrderController.updateOrder);
router.patch("/:id", OrderController.updateOrder);
router.delete("/:id", authenticateUser, OrderController.deleteOrder);

export default router;
