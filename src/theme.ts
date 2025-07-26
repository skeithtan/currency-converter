import { createTheme, Theme, useMediaQuery } from "@mui/material";
import React, { useEffect } from "react";

export function useTheme(): Theme {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
          background: {
            default: prefersDarkMode ? "#000" : "#fff",
            ...!prefersDarkMode && { paper: "#f3f2f7" },
          },
        },
        typography: {
          fontFamily: [
            "IBM Plex Sans",
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
          ].join(","),
        },
      }),
    [prefersDarkMode],
  );

  useEffect(() => {
    setMetaThemeColor(theme.palette.background.paper);
  }, [prefersDarkMode, theme.palette.background.default]);

  return theme;
}

function setMetaThemeColor(newThemeColor: string) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", newThemeColor);
  } else {
    const newMetaThemeColor = document.createElement("meta");
    newMetaThemeColor.name = "theme-color";
    newMetaThemeColor.content = newThemeColor;
    document.head.appendChild(newMetaThemeColor);
  }
}
