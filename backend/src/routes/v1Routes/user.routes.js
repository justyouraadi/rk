import express from "express";
import { UserController } from "../../controllers/index.js";
import { AuthMiddleware } from "../../middlewares/index.js";

const router = express.Router();

// Public auth routes
router.post("/signup", UserController.createUser);
router.post("/register", UserController.createUser);
router.post("/login", UserController.loginUser);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password", UserController.resetPasswordWithToken);
router.post("/send-otp", UserController.sendOtp);
router.post("/verify-otp", UserController.verifyOtp);
router.post("/test-email", UserController.testEmail);

// Authenticated user profile routes
router.get("/me", AuthMiddleware.authenticate, UserController.getProfile);
router.get("/profile", AuthMiddleware.authenticate, UserController.getProfile);
router.put("/profile", AuthMiddleware.authenticate, UserController.updateProfile);
router.patch("/profile", AuthMiddleware.authenticate, UserController.updateProfile);

// Admin-facing or specific user routes
router.get("/", AuthMiddleware.authenticate, UserController.getAllUsers);
router.get("/:id", AuthMiddleware.authenticate, UserController.getUserById);
router.post("/:id/reset-password", AuthMiddleware.authenticate, UserController.resetUserPassword);

export default router;
