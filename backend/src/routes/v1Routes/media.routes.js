import { Router } from "express";
import { MediaController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", MediaController.getAllMediaItems);
router.post("/", MediaController.createMediaItem);
router.get("/:id", MediaController.getMediaItemById);
router.put("/:id", MediaController.updateMediaItem);
router.patch("/:id", MediaController.updateMediaItem);
router.delete("/:id", authenticateUser, MediaController.deleteMediaItem);

export default router;

