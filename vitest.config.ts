import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@sp404-toolkit/core": path.resolve(here, "packages/core/src/index.ts"),
      "@sp404-toolkit/wav": path.resolve(here, "packages/wav/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] }
  }
});
