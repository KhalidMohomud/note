import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  deleteCurrentSession: vi.fn(),
  hashPassword: vi.fn(),
  redirect: vi.fn(),
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: mocks.userCreate,
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: mocks.createSession,
  deleteCurrentSession: mocks.deleteCurrentSession,
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  loginAction,
  logoutAction,
  registerAction,
} from "@/app/actions/auth";

function credentialsForm(email: string, password: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("authentication actions", () => {
  beforeEach(() => {
    mocks.hashPassword.mockResolvedValue("stored-password-hash");
  });

  it("rejects invalid registration input before querying the database", async () => {
    const result = await registerAction(
      {},
      credentialsForm("invalid", "short"),
    );

    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("hashes the password and creates a session when registration succeeds", async () => {
    mocks.userCreate.mockResolvedValue({ id: 42 });

    await registerAction(
      {},
      credentialsForm(" NewUser@Example.com ", "safe-password"),
    );

    expect(mocks.hashPassword).toHaveBeenCalledWith("safe-password");
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        email: "newuser@example.com",
        passwordHash: "stored-password-hash",
      },
      select: { id: true },
    });
    expect(mocks.createSession).toHaveBeenCalledWith(42);
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("handles duplicate registration emails", async () => {
    mocks.userCreate.mockRejectedValue({ code: "P2002" });

    const result = await registerAction(
      {},
      credentialsForm("user@example.com", "safe-password"),
    );

    expect(result).toEqual({
      message:
        "Unable to create your account. Try logging in if you already registered.",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("does not expose a session failure during registration", async () => {
    mocks.userCreate.mockResolvedValue({ id: 42 });
    mocks.createSession.mockRejectedValue(new Error("database details"));

    const result = await registerAction(
      {},
      credentialsForm("user@example.com", "safe-password"),
    );

    expect(result).toEqual({
      message:
        "Unable to create your account. Try logging in if you already registered.",
    });
    expect(result.message).not.toContain("database details");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects invalid login input before reading an account", async () => {
    const result = await loginAction(
      {},
      credentialsForm("invalid", "short"),
    );

    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns one safe error for an unknown login email", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.verifyPassword.mockResolvedValue(false);

    const result = await loginAction(
      {},
      credentialsForm("missing@example.com", "safe-password"),
    );

    expect(result).toEqual({ message: "Invalid email or password." });
    expect(mocks.verifyPassword).toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns the same safe error for an incorrect password", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: 7,
      passwordHash: "stored-password-hash",
    });
    mocks.verifyPassword.mockResolvedValue(false);

    const result = await loginAction(
      {},
      credentialsForm("user@example.com", "wrong-password"),
    );

    expect(result).toEqual({ message: "Invalid email or password." });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("creates a session when login succeeds", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: 7,
      passwordHash: "stored-password-hash",
    });
    mocks.verifyPassword.mockResolvedValue(true);

    await loginAction(
      {},
      credentialsForm("user@example.com", "safe-password"),
    );

    expect(mocks.createSession).toHaveBeenCalledWith(7);
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("does not expose a session failure during login", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: 7,
      passwordHash: "stored-password-hash",
    });
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockRejectedValue(new Error("database details"));

    const result = await loginAction(
      {},
      credentialsForm("user@example.com", "safe-password"),
    );

    expect(result).toEqual({
      message: "Unable to log in. Please try again.",
    });
    expect(result.message).not.toContain("database details");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("deletes the current session during logout", async () => {
    await logoutAction();

    expect(mocks.deleteCurrentSession).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
