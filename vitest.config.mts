import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/empty.ts") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    globalSetup: ["tests/setup-db.ts"],
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://diyafa:diyafa@localhost:5432/diyafa_test", DIRECT_URL: process.env.TEST_DATABASE_URL ?? "postgresql://diyafa:diyafa@localhost:5432/diyafa_test", PAYMENT_PROVIDER: "test", EMAIL_PROVIDER: "none" },
  },
});
