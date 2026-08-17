import { z } from "zod";

export const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(1, "Body is required.")
    .max(10_000, "Body must be 10,000 characters or fewer."),
});

export const noteIdSchema = z.coerce.number().int().positive();

export type NoteInput = z.infer<typeof noteSchema>;

export type NoteActionState = {
  errors?: {
    title?: string[];
    body?: string[];
  };
  message?: string;
};
