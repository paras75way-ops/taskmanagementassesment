import jwt from "jsonwebtoken";

export const generateAccessToken = (user: { _id: unknown; role?: string }) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user: { _id: unknown }) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" }
  );
};