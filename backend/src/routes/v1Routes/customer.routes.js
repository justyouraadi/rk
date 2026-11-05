import { Router } from "express";
import { CustomerController } from "../../controllers/index.js";
import { authenticateUser } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", CustomerController.getAllCustomers);
router.post("/", CustomerController.createCustomer);
router.get("/:id", CustomerController.getCustomerById);
router.put("/:id", CustomerController.updateCustomer);
router.patch("/:id", CustomerController.updateCustomer);
router.delete("/:id", authenticateUser, CustomerController.deleteCustomer);

export default router;

