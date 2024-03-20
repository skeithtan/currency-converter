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
