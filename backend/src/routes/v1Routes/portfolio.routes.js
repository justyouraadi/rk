import { Router } from "express";
import { PortfolioController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", PortfolioController.getAllPortfolioItems);
router.post("/", PortfolioController.createPortfolioItem);
router.get("/:id", PortfolioController.getPortfolioItemById);
router.put("/:id", PortfolioController.updatePortfolioItem);
router.patch("/:id", PortfolioController.updatePortfolioItem);
router.delete("/:id", authenticateUser, PortfolioController.deletePortfolioItem);

export default router;

