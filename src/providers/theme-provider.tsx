import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

/** Applies the current theme class to <html> and keeps it in sync. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
  }, [theme]);

  return <>{children}</>;
}
