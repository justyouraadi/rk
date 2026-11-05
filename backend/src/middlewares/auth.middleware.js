import { StatusCodes } from "http-status-codes";
import { UserService, AdminService } from "../services/index.js";
import { ErrorResponse, Utility } from "../utils/index.js";

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers["authorization"] || req.headers["x-access-token"];
      if (!authHeader) {
        ErrorResponse.message = "Authentication token missing";
        ErrorResponse.error = { explanation: "Authorization header or token is required" };
        return res.status(StatusCodes.UNAUTHORIZED).json(ErrorResponse);
      }

      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

      let payload;
      try {
        payload = await Utility.verifyJWT(token);
      } catch (tokenErr) {
        ErrorResponse.message = "Invalid or expired token";
        ErrorResponse.error = tokenErr;
        return res.status(StatusCodes.UNAUTHORIZED).json(ErrorResponse);
      }

      // Check if token belongs to an Admin
      if (payload.type === "ADMIN" || payload.role === "SUPER_ADMIN" || payload.role === "ADMIN") {
        const admin = await AdminService.isAuthenticated(token);
        req.admin = admin;
        req.user = admin;
        return next();
      }

      // Default to User authentication
      const user = await UserService.isAuthenticated(token);
      req.user = user;
      next();
    } catch (error) {
      ErrorResponse.message = "Authentication failed";
      ErrorResponse.error = error;
      return res.status(error.statusCode || StatusCodes.UNAUTHORIZED).json(ErrorResponse);
    }
  }

  async authenticateAdmin(req, res, next) {
    try {
      const authHeader = req.headers["authorization"] || req.headers["x-access-token"];
      if (!authHeader) {
        ErrorResponse.message = "Authentication token missing";
        ErrorResponse.error = { explanation: "Authorization header or token is required" };
        return res.status(StatusCodes.UNAUTHORIZED).json(ErrorResponse);
      }

      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
      const admin = await AdminService.isAuthenticated(token);
      req.admin = admin;
      next();
    } catch (error) {
      ErrorResponse.message = "Admin authentication failed";
      ErrorResponse.error = error;
      return res.status(error.statusCode || StatusCodes.UNAUTHORIZED).json(ErrorResponse);
    }
  }
}

const authMiddleware = new AuthMiddleware();
export const authenticate = authMiddleware.authenticate.bind(authMiddleware);
export const authenticateUser = authMiddleware.authenticate.bind(authMiddleware);
export const authenticateAdmin = authMiddleware.authenticateAdmin.bind(authMiddleware);
export default authMiddleware;
