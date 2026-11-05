import { Router } from "express";
import { PaymentController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", PaymentController.getAllPayments);
router.post("/", PaymentController.createPayment);
router.get("/:id", PaymentController.getPaymentById);
router.put("/:id", PaymentController.updatePayment);
router.patch("/:id", PaymentController.updatePayment);
router.delete("/:id", authenticateUser, PaymentController.deletePayment);

export default router;

