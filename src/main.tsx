import "@fontsource-variable/ibm-plex-sans/index.css";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import { CssBaseline } from "@mui/material";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <StrictMode>
    <CssBaseline />
    <App />
  </StrictMode>,
);

if (!import.meta.env.DEV && "serviceWorker" in navigator) {
  registerServiceWorker();
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`,
      { updateViaCache: "none" },
    );

    // Installed apps are mostly resumed from the background rather than
    // relaunched, which skips the browser's own update check. Check whenever
    // the app comes back to the foreground so new deploys still arrive.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        registration.update().catch(() => {});
      }
    });
  } catch (error) {
    console.error("Service worker registration failed", error);
  }

  // Ask the browser not to evict the offline copy under storage pressure.
  navigator.storage?.persist?.().catch(() => {});
}
