import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { serviceWorkerPlugin } from "./plugins/serviceWorkerPlugin.ts";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Reads .env files and the process environment (which takes precedence).
  // The empty prefix loads variables without the VITE_ prefix.
  const appId = loadEnv(mode, process.cwd(), "").OPEN_EXCHANGE_APP_ID;

  if (command === "build" && !appId) {
    throw new Error(
      "OPEN_EXCHANGE_APP_ID is not set — create a .env file with it or export it (see README)",
    );
  }

  return {
    plugins: [
      react(),
      serviceWorkerPlugin(
        fileURLToPath(new URL("./src/serviceWorker.js", import.meta.url)),
      ),
    ],
    base: "/currency-converter/",
    server: {
      allowedHosts: true,
    },
    // Defined in vite-env.d.ts
    define: {
      // Must be serialized as JSON string.
      // See: https://vite.dev/config/#using-environment-variables-in-config
      OPEN_EXCHANGE_APP_ID: JSON.stringify(appId ?? ""),
    },
  };
});
