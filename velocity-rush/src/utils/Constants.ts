/**
 * Global constants shared across the entire game.
 * Centralised here so tuning the game never requires hunting through scenes.
 */

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const STORAGE_KEY = 'velocity-rush-save-v1';
export const SETTINGS_KEY = 'velocity-rush-settings-v1';

export const MAX_PLAYER_LEVEL = 100;

/** XP required to go from level N to N+1 follows a smooth curve so early levels are fast. */
export function xpForLevel(level: number): number {
  return Math.round(180 * Math.pow(level, 1.42) + 120);
}

export const COLORS = {
  bgDark: 0x05070f,
  bgPanel: 0x0f1430,
  bgPanelLight: 0x171d42,
  accentPrimary: 0x4facfe,
  accentSecondary: 0xff5f6d,
  accentGold: 0xffc371,
  textPrimary: 0xe9f3ff,
  textMuted: 0x8fa0c8,
  success: 0x38ef7d,
  danger: 0xff4d5e,
  neon: 0x7fdcff,
} as const;

export const CSS_COLORS = {
  bgDark: '#05070f',
  bgPanel: '#0f1430',
  accentPrimary: '#4facfe',
  accentSecondary: '#ff5f6d',
  accentGold: '#ffc371',
  textPrimary: '#e9f3ff',
  textMuted: '#8fa0c8',
} as const;

export const DEPTHS = {
  background: 0,
  trackDecoration: 5,
  trackSurface: 10,
  trackMarkings: 15,
  shadow: 18,
  obstacles: 20,
  vehicles: 30,
  vehicleFx: 35,
  weather: 60,
  lighting: 70,
  hud: 100,
  touchControls: 110,
  overlay: 200,
  modal: 300,
} as const;

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export const DIFFICULTY_SETTINGS: Record<Difficulty, {
  label: string;
  aiSpeedMultiplier: number;
  aiRubberBand: number;
  aiMistakeChance: number;
  aiAggression: number;
  rewardMultiplier: number;
}> = {
  easy: { label: 'Easy', aiSpeedMultiplier: 0.86, aiRubberBand: 0.35, aiMistakeChance: 0.14, aiAggression: 0.3, rewardMultiplier: 0.8 },
  normal: { label: 'Normal', aiSpeedMultiplier: 0.95, aiRubberBand: 0.5, aiMistakeChance: 0.07, aiAggression: 0.55, rewardMultiplier: 1.0 },
  hard: { label: 'Hard', aiSpeedMultiplier: 1.02, aiRubberBand: 0.68, aiMistakeChance: 0.03, aiAggression: 0.78, rewardMultiplier: 1.3 },
  expert: { label: 'Expert', aiSpeedMultiplier: 1.08, aiRubberBand: 0.85, aiMistakeChance: 0.01, aiAggression: 0.95, rewardMultiplier: 1.7 },
};

export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'sandstorm';
export type TimeOfDay = 'day' | 'dusk' | 'night';

export const FONT_FAMILY = "'Segoe UI', Roboto, system-ui, -apple-system, sans-serif";
