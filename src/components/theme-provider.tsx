import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "system";
  storageKey?: string;
};

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "ui-theme" }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={defaultTheme} enableSystem storageKey={storageKey}>
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
