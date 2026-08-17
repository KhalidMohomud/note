import { describe, expect, it } from "vitest";

import { getTestDatabaseUrl } from "./test-database";

describe("test database safety", () => {
  it("does not fall back to DATABASE_URL when the test URL is missing", () => {
    expect(
      getTestDatabaseUrl({ DATABASE_URL: "postgresql://production.example/app" }),
    ).toBeUndefined();
  });

  it("accepts a distinct PostgreSQL test database URL", () => {
    const url = "postgresql://test.example/app_test";

    expect(
      getTestDatabaseUrl({
        DATABASE_URL: "postgresql://production.example/app",
        TEST_DATABASE_URL: url,
      }),
    ).toBe(url);
  });

  it("rejects reuse of the application database", () => {
    const url = "postgresql://database.example/app";

    expect(() =>
      getTestDatabaseUrl({ DATABASE_URL: url, TEST_DATABASE_URL: url }),
    ).toThrow(/matches DATABASE_URL/);
  });

  it.each(["not-a-url", "mysql://test.example/app_test"])(
    "rejects an invalid test database URL: %s",
    (url) => {
      expect(() => getTestDatabaseUrl({ TEST_DATABASE_URL: url })).toThrow(
        /valid PostgreSQL URL|must use PostgreSQL/,
      );
    },
  );
});
