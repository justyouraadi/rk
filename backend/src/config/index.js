import ServerConfig from "./server.config.js";
import { prisma } from "./db.js";
import cloudinary from "./cloudinary.config.js";
import emailConfig, { transporter, defaultSender, verifySmtpConnection } from "./email.config.js";
import redis from "./redis.js";
import razorpay from "./razorpay.js";

export {
  ServerConfig,
  prisma,
  cloudinary,
  emailConfig,
  transporter,
  defaultSender,
  verifySmtpConnection,
  redis,
  razorpay,
};

export default {
  ServerConfig,
  prisma,
  cloudinary,
  emailConfig,
  transporter,
  defaultSender,
  verifySmtpConnection,
  redis,
  razorpay,
};
