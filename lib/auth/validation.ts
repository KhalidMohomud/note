import { z } from "zod";

const MAX_BCRYPT_PASSWORD_BYTES = 72;

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email is too long.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .refine(
      (password) =>
        new TextEncoder().encode(password).length <= MAX_BCRYPT_PASSWORD_BYTES,
      "Password is too long.",
    ),
});

export type AuthActionState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
};
