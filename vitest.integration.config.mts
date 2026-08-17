import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    environment: "node",
    include: ["tests/integration/**/*.{test,spec}.ts"],
    mockReset: true,
    restoreMocks: true,
  },
});
