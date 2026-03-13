import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  verifyOtp,
  resendOtp,
  changePassword,
} from "./auth.controller";
import { protect } from "../common/middleware/auth.middleware";
import { authLimiter } from "../common/middleware/rateLimiter.middleware";
import {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  resendOtpValidation,
  changePasswordValidation,
} from "./auth.validation";
import { validateRequest } from "../common/middleware/validate.middleware";

const router = express.Router();

 
router.post("/register", authLimiter, registerValidation, validateRequest, register);
router.post("/login", authLimiter, loginValidation, validateRequest, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

router.post("/verify-otp", verifyOtpValidation, validateRequest, verifyOtp);
router.post("/resend-otp", resendOtpValidation, validateRequest, resendOtp);

router.get("/me", protect, getMe);
router.post("/change-password", protect, changePasswordValidation, validateRequest, changePassword);

export default router;