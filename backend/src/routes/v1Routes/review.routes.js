import { Router } from "express";
import { ReviewController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", ReviewController.getAllReviews);
router.post("/", ReviewController.createReview);
router.get("/:id", ReviewController.getReviewById);
router.put("/:id", ReviewController.updateReview);
router.patch("/:id", ReviewController.updateReview);
router.delete("/:id", authenticateUser, ReviewController.deleteReview);

export default router;

