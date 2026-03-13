export interface IUser {
  name: string;
  email: string;
  password: string;

  refreshToken?: string;

  isVerified: boolean;

  otp?: string;
  otpExpires?: Date;
}