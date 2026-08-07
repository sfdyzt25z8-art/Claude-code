export type CarClass = 'starter' | 'sport' | 'muscle' | 'super' | 'hyper' | 'offroad' | 'drift';

/** Raw base stats, all normalised 0-100 for UI display (radar charts, bars, etc). */
export interface CarBaseStats {
  topSpeed: number; // 0-100 (maps to km/h in physics)
  acceleration: number; // 0-100
  braking: number; // 0-100
  handling: number; // 0-100
  grip: number; // 0-100
  nitroPower: number; // 0-100
  weight: number; // 0-100 (higher = heavier, generally hurts accel/handling, helps stability)
}

export type UnlockRequirement =
  | { type: 'default' }
  | { type: 'level'; level: number }
  | { type: 'coins'; amount: number }
  | { type: 'trophies'; amount: number }
  | { type: 'career-event'; eventId: string }
  | { type: 'achievement'; achievementId: string };

export interface EngineSoundProfile {
  /** Base oscillator frequency (Hz) at idle RPM, scales with throttle/speed. */
  idleFreq: number;
  maxFreq: number;
  /** Oscillator waveform used by the synth engine — differentiates car "character". */
  waveform: OscillatorType;
  /** Amount of gritty distortion / overtone richness, 0-1. */
  growl: number;
  turboWhine: boolean;
}

export interface CarDefinition {
  id: string;
  name: string;
  manufacturer: string;
  class: CarClass;
  description: string;
  price: number; // coin cost in the shop (0 if not purchasable / unlock-only)
  stats: CarBaseStats;
  engineSound: EngineSoundProfile;
  unlock: UnlockRequirement;
  colorPrimary: number; // default paint hex
  colorSecondary: number; // default accent hex
  silhouette: 'compact' | 'coupe' | 'sedan' | 'muscle' | 'super' | 'suv' | 'truck';
}
