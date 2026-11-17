import dotenv from "dotenv";

dotenv.config();

export default {
  Base: {
    PORT: process.env.PORT || 3000,
  },
  Database: {
    URL: process.env.DATABASE_URL,
  },
  JWT: {
    SECRET: process.env.SECRET,
    EXPIRY: process.env.EXPIRY,
  },
  Cloudinary: {
    URL: process.env.CLOUDINARY_URL,
  },
  SMTP: {
    HOST: process.env.SMTP_HOST || "rkprinter.in",
    PORT: Number(process.env.SMTP_PORT) || 465,
    SECURE: process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === true,
    USER: process.env.SMTP_USER || "noreply@rkprinter.in",
    PASS: process.env.SMTP_PASS || "N_M==A7[^Pv@%osC",
    FROM: process.env.SMTP_FROM || "RK Printers <noreply@rkprinter.in>",
  },
  Redis: {
    URL: process.env.REDIS_URL || "redis://default:cIa42R6eOkhaH-qYm-v9vogBWKrSoDi8@db-82049eb4a93c.db.getvoroa.com:29201/0?sslmode=require",
  },
  Razorpay: {
    KEY_ID: process.env.RAZORPAY_KEY_ID || "rzp_test_TwTVCh5sO3eGIT",
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "IZdYUdUsL42n73hgGfwem6Ef",
  },
};
