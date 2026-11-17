import { Router } from "express";
import { PaymentController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";
import { idempotency } from "../../middlewares/idempotency.middleware.js";

const router = Router();

// Online Payment Flow (Protected: only logged-in users, with Redis Idempotency)
router.post("/razorpay/create-order", authenticateUser, idempotency({ required: false }), PaymentController.createRazorpayOrder);
router.post("/razorpay/order", authenticateUser, idempotency({ required: false }), PaymentController.createRazorpayOrder);
router.post("/razorpay/verify", authenticateUser, idempotency({ required: false }), PaymentController.verifyRazorpayPayment);

router.get("/", PaymentController.getAllPayments);
router.post("/", idempotency({ required: false }), PaymentController.createPayment);
router.get("/:id", PaymentController.getPaymentById);
router.put("/:id", PaymentController.updatePayment);
router.patch("/:id", PaymentController.updatePayment);
router.delete("/:id", authenticateUser, PaymentController.deletePayment);

export default router;

