import "@fontsource-variable/ibm-plex-sans";
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
  navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js");
}
