import { createContext, useContext, useEffect, useState } from "react";
import lightIcon from "@/assets/brand/glancy-web-light.svg";
import darkIcon from "@/assets/brand/glancy-web-dark.svg";

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "system",
  );
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const stored = localStorage.getItem("theme") || "system";
    if (stored === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return stored;
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      let current = theme;
      if (theme === "system") {
        current = media.matches ? "dark" : "light";
      }
      setResolvedTheme(current);
      document.documentElement.dataset.theme = current;
    };
    apply();
    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const link = document.getElementById("favicon");
      if (link) {
        link.href = media.matches ? darkIcon : lightIcon;
      }
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
