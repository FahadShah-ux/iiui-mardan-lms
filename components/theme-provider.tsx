"use client";

import * as React from "react";

type ThemeContextValue = {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const stored = localStorage.getItem("iiui-theme") as "light" | "dark" | "system" | null;
    if (stored) {
      const id = setTimeout(() => setThemeState(stored), 0);
      return () => clearTimeout(id);
    }
  }, []);

  React.useEffect(() => {
    const root = window.document.documentElement;
    const apply = (t: "light" | "dark") => {
      root.classList.remove("light", "dark");
      root.classList.add(t);
      setResolvedTheme(t);
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply(mq.matches ? "dark" : "light");
      apply(mq.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      apply(theme);
    }
  }, [theme]);

  const setTheme = React.useCallback((t: "light" | "dark" | "system") => {
    setThemeState(t);
    localStorage.setItem("iiui-theme", t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
