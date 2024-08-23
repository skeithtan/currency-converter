import { createTheme, Theme, useMediaQuery } from "@mui/material";
import React from "react";

export function useTheme(): Theme {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  return React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light"
        },
        typography: {
          fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            "\"Segoe UI\"",
            "Roboto",
            "\"Helvetica Neue\"",
            "Arial",
            "sans-serif",
            "\"Apple Color Emoji\"",
            "\"Segoe UI Emoji\"",
            "\"Segoe UI Symbol\""
          ].join(",")
        }
      }),
    [prefersDarkMode]
  );
}