import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const TOKEN_TTL = "7d";

// JWT_SECRET must be set in production. Locally we fall back to a random
// per-process secret so the app still runs (everyone is logged out on restart).
let devSecret = null;
const secret = () => {
     if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
     if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
          throw new Error("JWT_SECRET is not set.");
     }
     if (!devSecret) {
          devSecret = crypto.randomBytes(32).toString("hex");
          console.warn("[auth] JWT_SECRET not set — using a temporary dev secret. Add one to backEnd/.env.");
     }
     return devSecret;
};

export const signToken = (userId) => jwt.sign({}, secret(), { subject: String(userId), expiresIn: TOKEN_TTL });

// Express middleware: requires "Authorization: Bearer <token>", sets req.userId.
export const requireAuth = (req, res, next) => {
     const header = req.get("authorization") || "";
     const [scheme, token] = header.split(" ");
     if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Please log in." });
     try {
          const payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
          req.userId = payload.sub;
          return next();
     } catch (error) {
          if (error.message === "JWT_SECRET is not set.") return next(error);
          return res.status(401).json({ error: "Your session expired. Please log in again." });
     }
};
