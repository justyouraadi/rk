import nodemailer from "nodemailer";
import ServerConfig from "./server.config.js";

const { SMTP } = ServerConfig;

export const transporter = nodemailer.createTransport({
  host: SMTP.HOST,
  port: SMTP.PORT,
  secure: SMTP.SECURE,
  auth: {
    user: SMTP.USER,
    pass: SMTP.PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const defaultSender = SMTP.FROM;

export async function verifySmtpConnection() {
  try {
    await transporter.verify();
    return { success: true, message: "SMTP server is connected and ready." };
  } catch (error) {
    console.error("SMTP verification error:", error);
    return { success: false, error: error.message };
  }
}

export default {
  transporter,
  defaultSender,
  verifySmtpConnection,
  SMTP,
};

