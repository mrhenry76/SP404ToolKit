import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@sp404-toolkit/core": path.resolve(here, "../../packages/core/src/index.ts"),
      "@sp404-toolkit/manifest": path.resolve(here, "../../packages/manifest/src/index.ts"),
      "@sp404-toolkit/validator": path.resolve(here, "../../packages/validator/src/index.ts"),
      "@sp404-toolkit/wav": path.resolve(here, "../../packages/wav/src/index.ts"),
    },
  },
});
