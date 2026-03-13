import { z } from "zod";

export const signInSchema = z.object({
    email: z
        .string({ error: "Email is required" })
        .email("Please enter a valid email address"),

    password: z
        .string({ error: "Password is required" })
        .min(1, "Password is required"),
});

export const signUpSchema = z.object({
    name: z
        .string({ error: "Name is required" })
        .min(2, "Name must be at least 2 characters"),

    email: z
        .string({ error: "Email is required" })
        .email("Please enter a valid email address"),

    password: z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
});

export const changePasswordSchema = z.object({
    currentPassword: z
        .string({ error: "Current password is required" })
        .min(1, "Current password is required"),

    newPassword: z
        .string({ error: "New password is required" })
        .min(8, "New password must be at least 8 characters")
        .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
        .regex(/[0-9]/, "New password must contain at least one number"),
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
