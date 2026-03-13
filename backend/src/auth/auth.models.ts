import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./auth.types";

export interface IUserDocument extends IUser, Document {
  otp?: string;
  otpExpires?: Date;
  isVerified: boolean;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    refreshToken: { type: String },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUserDocument>("User", userSchema);