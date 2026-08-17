import { describe, expect, it } from "vitest";

import { credentialsSchema } from "@/lib/auth/validation";

describe("authentication validation", () => {
  it("normalizes a valid email without changing the password", () => {
    const result = credentialsSchema.parse({
      email: "  Developer@Example.COM ",
      password: " secure password ",
    });

    expect(result).toEqual({
      email: "developer@example.com",
      password: " secure password ",
    });
  });

  it("rejects an invalid email", () => {
    const result = credentialsSchema.safeParse({
      email: "not-an-email",
      password: "valid-password",
    });

    expect(result.success).toBe(false);
  });

  it("rejects passwords shorter than eight characters", () => {
    const result = credentialsSchema.safeParse({
      email: "developer@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects passwords beyond bcrypt's byte limit", () => {
    const result = credentialsSchema.safeParse({
      email: "developer@example.com",
      password: "🔐".repeat(19),
    });

    expect(result.success).toBe(false);
  });
});
