import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieDelete: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  sessionCreate: vi.fn(),
  sessionDeleteMany: vi.fn(),
  sessionFindUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    delete: mocks.cookieDelete,
    get: mocks.cookieGet,
    set: mocks.cookieSet,
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      create: mocks.sessionCreate,
      deleteMany: mocks.sessionDeleteMany,
      findUnique: mocks.sessionFindUnique,
    },
  },
}));

import {
  createSession,
  deleteCurrentSession,
} from "@/lib/auth/session";

describe("database sessions", () => {
  beforeEach(() => {
    mocks.sessionCreate.mockResolvedValue({});
    mocks.sessionDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("stores only a token hash and sets a secure HTTP-only cookie", async () => {
    await createSession(42);

    const [, rawToken, cookieOptions] = mocks.cookieSet.mock.calls[0];
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    expect(mocks.sessionCreate).toHaveBeenCalledWith({
      data: {
        tokenHash,
        userId: 42,
        expiresAt: expect.any(Date),
      },
    });
    expect(rawToken).not.toBe(tokenHash);
    expect(cookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    });
  });

  it("revokes the database session and removes the cookie", async () => {
    mocks.cookieGet.mockReturnValue({ value: "raw-session-token" });

    await deleteCurrentSession();

    const tokenHash = createHash("sha256")
      .update("raw-session-token")
      .digest("hex");
    expect(mocks.sessionDeleteMany).toHaveBeenCalledWith({
      where: { tokenHash },
    });
    expect(mocks.cookieDelete).toHaveBeenCalledWith("welcome-notes-session");
  });
});
