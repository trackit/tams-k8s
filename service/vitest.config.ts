import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    env: {
      AWS_ACCESS_KEY_ID: "fakeAccessKeyId",
      AWS_SECRET_ACCESS_KEY: "fakeSecretAccessKey",
    },
  },
});
