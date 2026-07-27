import React, { createContext, useContext, useMemo, useState } from "react";
import { getThemeTokens, type AppMode, type ThemeTokens } from "@organizer/shared";
import { useAuth } from "../lib/auth-context";

interface ThemeContextValue {
  theme: ThemeTokens;
  mode: AppMode;
  /** Lets Settings preview a different mode before persisting it via PATCH /api/profile. */
  overrideMode: (mode: AppMode | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Mirrors the web app's theme system: `getThemeTokens(mode)` from
 * @organizer/shared drives colors/gradients/copy. There is no CSS-variable
 * equivalent in React Native, so we expose the resolved tokens through a
 * context + `useTheme()` hook that screens/components read from directly.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [localOverride, setLocalOverride] = useState<AppMode | null>(null);

  const mode: AppMode = localOverride ?? profile?.mode ?? "personal";
  const theme = useMemo(() => getThemeTokens(mode), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, overrideMode: setLocalOverride }),
    [theme, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
