import { useEffect } from "react";
import { useTheme } from "next-themes";

const THEME_COLORS = {
  light: "#fcfbf8",
  dark: "#0d0d0f",
} as const;

function getPreferredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const ThemeMetaColor = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const theme = resolvedTheme === "dark" || resolvedTheme === "light" ? resolvedTheme : getPreferredTheme();
    const color = theme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", color);
  }, [resolvedTheme]);

  return null;
};
