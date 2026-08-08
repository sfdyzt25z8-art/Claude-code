import type { WeatherType, TimeOfDay } from '../utils/Constants';
import type { Vec2 } from '../utils/MathUtils';

export type TrackTheme =
  | 'city'
  | 'desert'
  | 'forest'
  | 'mountains'
  | 'beach'
  | 'snow'
  | 'volcano'
  | 'nightcity'
  | 'highway'
  | 'industrial'
  | 'canyon'
  | 'harbor'
  | 'airport'
  | 'stadium'
  | 'countryside'
  | 'f1street'
  | 'f1speed';

export interface ThemePalette {
  surface: number;
  surfaceLine: number;
  offTrack: number;
  offTrackDetail: number;
  decorationPrimary: number;
  decorationSecondary: number;
  skyTop: number;
  skyBottom: number;
  fogColor: number;
}

export type ObstacleType = 'cone' | 'barrier' | 'rock' | 'tree' | 'crate' | 'puddle' | 'signpost' | 'barrel';

export interface TrackObstacle {
  /** progress (0-1) along the centerline where this obstacle sits */
  at: number;
  /** lateral offset from centerline, in fraction of half-width (-1..1) */
  offset: number;
  type: ObstacleType;
  radius: number;
}

export interface TrackJumpZone {
  /** progress range [start, end] (0-1) */
  start: number;
  end: number;
  height: number; // visual/air-time strength
}

/** A shortcut is modelled as a widened section with an island obstacle splitting inner/outer lines. */
export interface TrackShortcut {
  start: number;
  end: number;
  /** extra width multiplier during the shortcut zone */
  widthMultiplier: number;
}

export interface TrackWeatherOption {
  weather: WeatherType;
  weight: number;
}

export interface TrackDefinition {
  id: string;
  name: string;
  theme: TrackTheme;
  description: string;
  laps: number;
  /** Sparse control points defining the closed-loop centerline (world units). Smoothed via Catmull-Rom. */
  controlPoints: Vec2[];
  baseWidth: number;
  obstacles: TrackObstacle[];
  jumps: TrackJumpZone[];
  shortcuts: TrackShortcut[];
  weatherOptions: TrackWeatherOption[];
  timeOfDay: TimeOfDay;
  unlockLevel: number;
  palette: ThemePalette;
  /** Recommended lap-record baseline in seconds, used to grade medal times. */
  targetLapTime: number;
}
