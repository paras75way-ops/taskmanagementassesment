import { z } from "zod";

export const boardSchema = z.object({
    name: z
        .string({ error: "Board name is required" })
        .min(1, "Board name is required")
        .max(50, "Board name must be 50 characters or less"),
});

export type BoardFormData = z.infer<typeof boardSchema>;
