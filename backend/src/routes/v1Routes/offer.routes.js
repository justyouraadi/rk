import { Router } from "express";
import { OfferController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", OfferController.getAllOffers);
router.post("/", OfferController.createOffer);
router.get("/:id", OfferController.getOfferById);
router.put("/:id", OfferController.updateOffer);
router.patch("/:id", OfferController.updateOffer);
router.delete("/:id", authenticateUser, OfferController.deleteOffer);

export default router;

