import type { AppMode } from "../types/mode";

export interface ThemeTokens {
  mode: AppMode;
  label: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceGlass: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  backgroundImageKey: string;
  gradient: [string, string];
  motivation: string;
}

/**
 * Design tokens driving the whole app's look when a user switches mode.
 * Web/mobile map these onto CSS variables / RN style objects; nothing here
 * is platform specific so both clients stay visually in sync.
 */
export const THEME_TOKENS: Record<AppMode, ThemeTokens> = {
  student: {
    mode: "student",
    label: "Student",
    colors: {
      primary: "#1E3A8A", // blue
      secondary: "#FFFFFF", // white
      accent: "#D4AF37", // gold
      background: "#F5F7FB",
      surface: "#FFFFFF",
      surfaceGlass: "rgba(255,255,255,0.55)",
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      border: "rgba(30,58,138,0.12)",
    },
    backgroundImageKey: "library-study-desk",
    gradient: ["#1E3A8A", "#D4AF37"],
    motivation: "Every page you turn today is a version of you tomorrow will thank you for.",
  },
  business: {
    mode: "business",
    label: "Business",
    colors: {
      primary: "#0B0F19", // black
      secondary: "#0F1E3D", // dark blue
      accent: "#D4AF37", // gold
      background: "#0B0F19",
      surface: "#111827",
      surfaceGlass: "rgba(17,24,39,0.55)",
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      border: "rgba(212,175,55,0.18)",
    },
    backgroundImageKey: "city-skyline-office",
    gradient: ["#0B0F19", "#0F1E3D"],
    motivation: "Build the company. Track the numbers. Own the outcome.",
  },
  personal: {
    mode: "personal",
    label: "Personal",
    colors: {
      primary: "#FFFFFF",
      secondary: "#DCEEFB", // light blue
      accent: "#94A3B8", // gray
      background: "#F8FAFC",
      surface: "#FFFFFF",
      surfaceGlass: "rgba(255,255,255,0.6)",
      textPrimary: "#1E293B",
      textSecondary: "#64748B",
      border: "rgba(148,163,184,0.2)",
    },
    backgroundImageKey: "nature-wellness",
    gradient: ["#DCEEFB", "#F8FAFC"],
    motivation: "Small, calm steps compound into the life you're building.",
  },
};

export function getThemeTokens(mode: AppMode | null | undefined): ThemeTokens {
  return THEME_TOKENS[mode ?? "personal"];
}
