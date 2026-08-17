const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

export function getTestDatabaseUrl(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  const testDatabaseUrl = environment.TEST_DATABASE_URL?.trim();

  if (!testDatabaseUrl) {
    return undefined;
  }

  const productionDatabaseUrl = environment.DATABASE_URL?.trim();

  if (productionDatabaseUrl && testDatabaseUrl === productionDatabaseUrl) {
    throw new Error(
      "Refusing to run integration tests: TEST_DATABASE_URL matches DATABASE_URL.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(testDatabaseUrl);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (!POSTGRES_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new Error("TEST_DATABASE_URL must use PostgreSQL.");
  }

  return testDatabaseUrl;
}
