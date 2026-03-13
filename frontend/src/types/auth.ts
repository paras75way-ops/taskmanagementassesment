export interface IUser {
  id: string;
  email: string;
}

export interface ISignInForm {
  email: string;
  password: string;
}

export interface ISignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
}