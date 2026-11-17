import Redis from "ioredis";
import ServerConfig from "./server.config.js";

const redisUrl = ServerConfig.Redis.URL;

let redis = null;

try {
  const options = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  };

  // If URL has sslmode=require or rediss scheme, ensure TLS is enabled
  if (redisUrl.includes("sslmode=require") || redisUrl.startsWith("rediss://")) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  // Strip query params like ?sslmode=require if ioredis doesn't auto-handle them
  const cleanedUrl = redisUrl.split("?")[0];
  redis = new Redis(cleanedUrl, options);

  redis.on("connect", () => {
    console.log("[Redis] Connected to Redis successfully");
  });

  redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });
} catch (error) {
  console.error("[Redis] Failed to initialize Redis client:", error.message);
}

export { redis };
export default redis;
