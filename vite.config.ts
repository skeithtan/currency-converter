/// <reference lib="deno.ns" />
import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import react from "@vitejs/plugin-react";

const OPEN_EXCHANGE_APP_ID = Deno.env.get("OPEN_EXCHANGE_APP_ID")!;

// https://vite.dev/config/
export default defineConfig({
  plugins: [deno(), react()],
  base: "/currency-converter/",
  server: {
    allowedHosts: true,
  },
  // Defined in vite-env.d.ts
  define: {
    // Must be serialized as JSON string.
    // See: https://vite.dev/config/#using-environment-variables-in-config
    OPEN_EXCHANGE_APP_ID: JSON.stringify(OPEN_EXCHANGE_APP_ID),
  },
});
