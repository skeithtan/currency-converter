/// <reference lib="deno.ns" />
import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const appId = Deno.env.get("OPEN_EXCHANGE_APP_ID");

  if (command === "build" && !appId) {
    throw new Error(
      "OPEN_EXCHANGE_APP_ID is not set — create a .env file with it or export it (see README)",
    );
  }

  return {
    plugins: [deno(), react()],
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
