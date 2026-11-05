import { v2 as cloudinary } from "cloudinary";
import ServerConfig from "./server.config.js";

const cloudinaryUrl = ServerConfig.Cloudinary?.URL || process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  try {
    const parsed = new URL(cloudinaryUrl);
    cloudinary.config({
      cloud_name: parsed.hostname,
      api_key: parsed.username,
      api_secret: parsed.password,
      secure: true,
    });
  } catch (error) {
    console.error("Failed to parse CLOUDINARY_URL:", error);
  }
} else {
  console.warn("CLOUDINARY_URL not found in environment variables");
}

export default cloudinary;

