import User from "./auth.models";
import type { IUserDocument } from "./auth.models";

export const AuthService = {
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email });
  },

  async findById(userId: string): Promise<IUserDocument | null> {
    return User.findById(userId);
  },

  async findByIdWithoutPassword(userId: string): Promise<IUserDocument | null> {
    return User.findById(userId).select("-password");
  },

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    otp: string;
    otpExpires: Date;
    isVerified: boolean;
  }): Promise<IUserDocument> {
    return User.create(data);
  },

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken });
  },

  async saveUser(user: IUserDocument): Promise<IUserDocument> {
    return user.save();
  },
};