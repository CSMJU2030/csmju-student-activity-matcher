import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests run in jsdom (vitest + jsdom are on the stack whitelist).
export default defineConfig({
  // tsconfig keeps jsx: "preserve" for Next; tests compile JSX themselves.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    pool: "threads",
  },
});
