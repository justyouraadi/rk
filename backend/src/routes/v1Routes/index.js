import express from "express";
import userRoutes from "./user.routes.js";
import adminRoutes from "./admin.routes.js";
import uploadRoutes from "./upload.routes.js";
import productRoutes from "./product.routes.js";
import categoryRoutes from "./category.routes.js";
import serviceRoutes from "./service.routes.js";
import industryRoutes from "./industry.routes.js";
import leadRoutes from "./lead.routes.js";
import quotationRoutes from "./quotation.routes.js";
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js";
import customerRoutes from "./customer.routes.js";
import reviewRoutes from "./review.routes.js";
import mediaRoutes from "./media.routes.js";
import notificationRoutes from "./notification.routes.js";
import importJobRoutes from "./import-job.routes.js";
import offerRoutes from "./offer.routes.js";
import portfolioRoutes from "./portfolio.routes.js";
import genericEntityRoutes from "./entity.routes.js";

const router = express.Router();

// Authentication & Profile
router.use("/users", userRoutes);
router.use("/admins", adminRoutes);
router.use("/admin", adminRoutes);

// File & Media Uploads via Cloudinary
router.use("/uploads", uploadRoutes);
router.use("/upload", uploadRoutes);

// Dedicated Domain Routes
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/services", serviceRoutes);
router.use("/industries", industryRoutes);
router.use("/leads", leadRoutes);
router.use("/quotations", quotationRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/customers", customerRoutes);
router.use("/reviews", reviewRoutes);
router.use("/media", mediaRoutes);
router.use("/media-items", mediaRoutes);
router.use("/notifications", notificationRoutes);
router.use("/import-jobs", importJobRoutes);
router.use("/importjobs", importJobRoutes);
router.use("/offers", offerRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/portfolio-items", portfolioRoutes);

// Dynamic Entity Fallback (/api/v1/entities/:entity)
router.use("/entities", genericEntityRoutes);

export default router;
