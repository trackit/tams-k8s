import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    env: {
      AWS_ACCESS_KEY_ID: "fakeAccessKeyId",
      AWS_SECRET_ACCESS_KEY: "fakeSecretAccessKey",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force la résolution des extensions TypeScript
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
});
