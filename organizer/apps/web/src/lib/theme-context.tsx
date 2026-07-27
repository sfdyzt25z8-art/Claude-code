"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getThemeTokens, type AppMode, type ThemeTokens } from "@organizer/shared";

interface ThemeContextValue {
  mode: AppMode;
  tokens: ThemeTokens;
  setMode: (mode: AppMode) => void;
  /** True while the user is only previewing a mode (pre-onboarding), not yet committed. */
  isPreview: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "organizer:theme-mode";

function applyThemeToDom(tokens: ThemeTokens) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", tokens.colors.primary);
  root.style.setProperty("--color-secondary", tokens.colors.secondary);
  root.style.setProperty("--color-accent", tokens.colors.accent);
  root.style.setProperty("--color-background", tokens.colors.background);
  root.style.setProperty("--color-surface", tokens.colors.surface);
  root.style.setProperty("--color-surface-glass", tokens.colors.surfaceGlass);
  root.style.setProperty("--color-text-primary", tokens.colors.textPrimary);
  root.style.setProperty("--color-text-secondary", tokens.colors.textSecondary);
  root.style.setProperty("--color-border", tokens.colors.border);
  root.style.setProperty("--color-gradient-from", tokens.gradient[0]);
  root.style.setProperty("--color-gradient-to", tokens.gradient[1]);
  root.dataset.mode = tokens.mode;
  root.classList.toggle("dark", tokens.mode === "business");
}

export function ThemeProvider({
  children,
  initialMode,
}: {
  children: ReactNode;
  initialMode?: AppMode | null;
}) {
  const [mode, setModeState] = useState<AppMode>(initialMode ?? "personal");
  const [isPreview, setIsPreview] = useState(!initialMode);

  useEffect(() => {
    if (initialMode) {
      setModeState(initialMode);
      setIsPreview(false);
      return;
    }
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY) as AppMode | null;
      if (stored === "student" || stored === "business" || stored === "personal") {
        setModeState(stored);
      }
      setIsPreview(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  const tokens = useMemo(() => getThemeTokens(mode), [mode]);

  useEffect(() => {
    applyThemeToDom(tokens);
  }, [tokens]);

  const setMode = useCallback((next: AppMode) => {
    setModeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, tokens, setMode, isPreview }),
    [mode, tokens, setMode, isPreview]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
