import { body } from "express-validator";

export const registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string")
        .isLength({ min: 2 })
        .withMessage("Name must be at least 2 characters"),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email address"),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain at least one number"),
];

export const loginValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email address"),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

export const verifyOtpValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email address"),
    body("otp")
        .trim()
        .notEmpty()
        .withMessage("OTP is required")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be exactly 6 digits")
        .isNumeric()
        .withMessage("OTP must contain only digits"),
];

export const resendOtpValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email address"),
];

export const changePasswordValidation = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),
    body("newPassword")
        .notEmpty()
        .withMessage("New password is required")
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters")
        .matches(/[A-Z]/)
        .withMessage("New password must contain at least one uppercase letter")
        .matches(/[0-9]/)
        .withMessage("New password must contain at least one number"),
];
