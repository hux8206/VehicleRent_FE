"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type Theme = "light";

export interface ThemeContextType {
  theme: "light";
  resolvedTheme: "light";
  setTheme: (theme: any) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const defaultThemeContext: ThemeContextType = {
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  mounted: true,
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

function ThemeBridge({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
      try {
        localStorage.setItem("theme", "light");
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        resolvedTheme: "light",
        setTheme: () => {},
        toggleTheme: () => {},
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ThemeBridge>{children}</ThemeBridge>
    </NextThemesProvider>
  );
}

export function useTheme() {
  return useContext(ThemeContext) || defaultThemeContext;
}
