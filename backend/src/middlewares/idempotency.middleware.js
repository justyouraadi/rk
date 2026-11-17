import { redis } from "../config/index.js";
import { StatusCodes } from "http-status-codes";

/**
 * Middleware to enforce or handle Idempotency using Redis.
 * Supports Idempotency-Key header or X-Idempotency-Key or body.idempotency_key.
 *
 * @param {Object} options
 * @param {boolean} options.required - Whether the idempotency key is mandatory (default: false)
 * @param {number} options.lockTtl - Seconds to lock while request is in flight (default: 60)
 * @param {number} options.cacheTtl - Seconds to cache resolved response (default: 86400 = 24h)
 */
export const idempotency = (options = {}) => {
  const {
    required = false,
    lockTtl = 60,
    cacheTtl = 86400,
  } = options;

  return async (req, res, next) => {
    // Only apply to state-modifying requests (POST, PUT, PATCH, DELETE)
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }

    const idempotencyKey =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      req.body?.idempotency_key;

    if (!idempotencyKey) {
      if (required) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Idempotency-Key header is required for this operation",
        });
      }
      return next();
    }

    // Sanitize key
    const redisKey = `idempotency:${String(idempotencyKey).trim()}`;

    try {
      if (redis.status !== "ready" && redis.status !== "connecting") {
        await redis.connect().catch((err) => {
          console.warn("[Idempotency] Redis connect warning:", err.message);
        });
      }

      // Check existing key in Redis
      const existing = await redis.get(redisKey);
      if (existing) {
        try {
          const cached = JSON.parse(existing);
          if (cached.status === "PROCESSING") {
            return res.status(StatusCodes.CONFLICT).json({
              success: false,
              message: "An identical request with this Idempotency-Key is currently processing. Please wait.",
            });
          }

          if (cached.status === "RESOLVED") {
            res.setHeader("X-Idempotent-Replay", "true");
            res.setHeader("Idempotency-Key", String(idempotencyKey));
            return res.status(cached.statusCode || StatusCodes.OK).json(cached.body);
          }
        } catch (parseErr) {
          console.error("[Idempotency] Parse error for cached key:", parseErr);
        }
      }

      // Try acquiring atomic lock
      const acquired = await redis.set(
        redisKey,
        JSON.stringify({ status: "PROCESSING", startedAt: Date.now() }),
        "EX",
        lockTtl,
        "NX"
      );

      if (!acquired) {
        // Double-check if it resolved in the race
        const lateCheck = await redis.get(redisKey);
        if (lateCheck) {
          const cached = JSON.parse(lateCheck);
          if (cached.status === "RESOLVED") {
            res.setHeader("X-Idempotent-Replay", "true");
            return res.status(cached.statusCode || StatusCodes.OK).json(cached.body);
          }
        }
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "An identical request with this Idempotency-Key is currently in flight.",
        });
      }

      // Intercept response
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      let responseHandled = false;

      const cacheResponse = async (body, statusCode) => {
        if (responseHandled) return;
        responseHandled = true;

        try {
          if (statusCode >= 200 && statusCode < 300) {
            await redis.set(
              redisKey,
              JSON.stringify({
                status: "RESOLVED",
                statusCode,
                body,
                resolvedAt: Date.now(),
              }),
              "EX",
              cacheTtl
            );
          } else {
            // Remove processing lock on client error or server error so user can retry
            await redis.del(redisKey);
          }
        } catch (cacheErr) {
          console.error("[Idempotency] Failed to cache response in Redis:", cacheErr.message);
        }
      };

      res.json = function (body) {
        cacheResponse(body, res.statusCode);
        return originalJson(body);
      };

      res.send = function (body) {
        let parsed = body;
        try {
          if (typeof body === "string") {
            parsed = JSON.parse(body);
          }
        } catch (e) {
          // not json
        }
        cacheResponse(parsed, res.statusCode);
        return originalSend(body);
      };

      next();
    } catch (redisError) {
      console.error("[Idempotency] Error communicating with Redis:", redisError.message);
      // If redis is totally down, don't completely block execution unless required
      if (required) {
        return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
          success: false,
          message: "Idempotency service temporarily unavailable",
        });
      }
      next();
    }
  };
};

export default idempotency;
