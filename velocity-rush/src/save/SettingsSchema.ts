import type { Difficulty } from '../utils/Constants';

export type GraphicsQuality = 'low' | 'medium' | 'high';
export type FpsCap = 30 | 60 | 120 | 0; // 0 = uncapped
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'pt';

export interface AccessibilitySettings {
  screenShake: boolean;
  highContrastUI: boolean;
  reduceMotion: boolean;
  colorblindAssist: boolean;
  largeText: boolean;
}

export interface SettingsData {
  graphicsQuality: GraphicsQuality;
  fpsCap: FpsCap;
  particlesEnabled: boolean;
  motionBlur: boolean;
  dynamicLighting: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  controlScheme: 'auto' | 'keyboard' | 'touch' | 'gamepad';
  steeringAssist: boolean;
  defaultDifficulty: Difficulty;
  language: Language;
  accessibility: AccessibilitySettings;
}

export function createDefaultSettings(): SettingsData {
  return {
    graphicsQuality: 'high',
    fpsCap: 60,
    particlesEnabled: true,
    motionBlur: true,
    dynamicLighting: true,
    masterVolume: 0.85,
    musicVolume: 0.55,
    sfxVolume: 0.85,
    controlScheme: 'auto',
    steeringAssist: true,
    defaultDifficulty: 'normal',
    language: 'en',
    accessibility: {
      screenShake: true,
      highContrastUI: false,
      reduceMotion: false,
      colorblindAssist: false,
      largeText: false,
    },
  };
}
