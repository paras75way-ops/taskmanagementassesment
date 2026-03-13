import { z } from "zod";

export const taskSchema = z.object({
    title: z
        .string({ error: "Title is required" })
        .min(1, "Title is required")
        .max(100, "Title must be 100 characters or less"),
    description: z
        .string()
        .max(500, "Description must be 500 characters or less")
        .optional(),
    targetDate: z
        .string()
        .optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
