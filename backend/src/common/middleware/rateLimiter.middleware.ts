import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { AuthRequest } from "./auth.middleware";

export const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per `window`
    message: { message: "Too many requests, try again later" },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const taskLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each user to 60 requests per `window`
    message: { message: "Too many requests, try again later" },
    keyGenerator: (req) => {
        const authReq = req as AuthRequest;
        return authReq.user?.id || ipKeyGenerator(req.ip || "unknown");
    },
    standardHeaders: true,
    legacyHeaders: false,
});
