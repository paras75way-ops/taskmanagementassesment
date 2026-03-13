import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthService } from "./auth.service";
import { AuthRequest } from "../common/middleware/auth.middleware";
import { generateAccessToken, generateRefreshToken } from "../common/utils/token";
import { sendOtpEmail } from "../common/utils/email";
import { asyncHandler } from "../common/utils/asyncHandler";
import { AppError } from "../common/utils/AppError";

interface RefreshTokenPayload {
  id: string;
  iat?: number;
  exp?: number;
}

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };

  const existingUser = await AuthService.findByEmail(email);
  if (existingUser) throw new AppError("User already exists", 409);

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  await AuthService.createUser({
    name,
    email,
    password: hashedPassword,
    otp,
    otpExpires: new Date(Date.now() + 10 * 60 * 1000),
    isVerified: false,
  });

  await sendOtpEmail(email, otp);

  res.status(201).json({ message: "OTP sent to email" });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };

  const user = await AuthService.findByEmail(email);
  if (!user) throw new AppError("User not found", 404);
  if (user.isVerified) throw new AppError("User already verified", 400);

  if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await AuthService.saveUser(user);

  res.json({ message: "Email verified successfully" });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const user = await AuthService.findByEmail(email);
  if (!user) throw new AppError("User not found", 404);
  if (user.isVerified) throw new AppError("Email already verified", 400);

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await AuthService.saveUser(user);

  await sendOtpEmail(email, otp);

  res.json({ message: "OTP resent successfully" });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await AuthService.findByEmail(email);
  if (!user) throw new AppError("Invalid credentials", 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  if (!user.isVerified) throw new AppError("Please verify your email first", 403);

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = newRefreshToken;
  await AuthService.saveUser(user);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.json({ accessToken });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken as string | undefined;

  if (!token) throw new AppError("No refresh token", 401);

  let decoded: RefreshTokenPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
  } catch {
    throw new AppError("Invalid refresh token", 403);
  }

  const user = await AuthService.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    throw new AppError("Invalid refresh token", 403);
  }

  const newAccessToken = generateAccessToken(user);
  res.json({ accessToken: newAccessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken as string | undefined;

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET!
      ) as RefreshTokenPayload;

      await AuthService.updateRefreshToken(decoded.id, null);
    } catch { }
  }

  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const user = await AuthService.findByIdWithoutPassword(userId);
  if (!user) throw new AppError("User not found", 404);

  res.json(user);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await AuthService.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect", 400);

  user.password = await bcrypt.hash(newPassword, 10);
  await AuthService.saveUser(user);

  res.json({ message: "Password changed successfully" });
});