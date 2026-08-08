import type { TrackDefinition, TrackTheme, TrackWeatherOption } from './TrackTypes';
import { THEME_PALETTES, THEME_OBSTACLES } from './TrackPalettes';
import { buildClosedSpline, pathLength } from '../utils/MathUtils';
import { generateJumps, generateLoopControlPoints, generateShortcuts, scatterObstacles } from './TrackGenerator';

interface TrackSeed {
  id: string;
  name: string;
  theme: TrackTheme;
  description: string;
  laps: number;
  pointCount: number;
  radiusX: number;
  radiusY: number;
  irregularity: number;
  angleJitter: number;
  baseWidth: number;
  obstacleCount: number;
  jumpCount: number;
  shortcutCount: number;
  weatherOptions: TrackWeatherOption[];
  timeOfDay: 'day' | 'dusk' | 'night';
  unlockLevel: number;
}

const SEEDS: TrackSeed[] = [
  {
    id: 'city_circuit', name: 'Downtown Circuit', theme: 'city',
    description: 'A tight street circuit weaving through skyscraper canyons.',
    laps: 3, pointCount: 10, radiusX: 1400, radiusY: 1000, irregularity: 0.28, angleJitter: 0.25,
    baseWidth: 220, obstacleCount: 14, jumpCount: 0, shortcutCount: 2,
    weatherOptions: [{ weather: 'clear', weight: 7 }, { weather: 'rain', weight: 3 }],
    timeOfDay: 'day', unlockLevel: 1,
  },
  {
    id: 'desert_dunes', name: 'Dune Drifter', theme: 'desert',
    description: 'Sweeping high-speed curves across sunbaked dunes.',
    laps: 3, pointCount: 9, radiusX: 1700, radiusY: 1200, irregularity: 0.22, angleJitter: 0.18,
    baseWidth: 260, obstacleCount: 10, jumpCount: 3, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 8 }, { weather: 'sandstorm', weight: 2 }],
    timeOfDay: 'day', unlockLevel: 2,
  },
  {
    id: 'emerald_forest', name: 'Emerald Forest', theme: 'forest',
    description: 'Narrow, technical forest roads with blind, tightening corners.',
    laps: 3, pointCount: 11, radiusX: 1300, radiusY: 950, irregularity: 0.34, angleJitter: 0.3,
    baseWidth: 190, obstacleCount: 16, jumpCount: 1, shortcutCount: 2,
    weatherOptions: [{ weather: 'clear', weight: 5 }, { weather: 'rain', weight: 4 }, { weather: 'fog', weight: 2 }],
    timeOfDay: 'day', unlockLevel: 4,
  },
  {
    id: 'summit_pass', name: 'Summit Pass', theme: 'mountains',
    description: 'A switchback mountain road with sheer drops and thin air.',
    laps: 2, pointCount: 12, radiusX: 1500, radiusY: 1400, irregularity: 0.3, angleJitter: 0.22,
    baseWidth: 200, obstacleCount: 12, jumpCount: 2, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 6 }, { weather: 'fog', weight: 3 }, { weather: 'snow', weight: 2 }],
    timeOfDay: 'dusk', unlockLevel: 6,
  },
  {
    id: 'sunset_beach', name: 'Sunset Beach', theme: 'beach',
    description: 'Coastal roads with sandy shortcuts and ocean spray.',
    laps: 3, pointCount: 9, radiusX: 1600, radiusY: 1000, irregularity: 0.24, angleJitter: 0.2,
    baseWidth: 240, obstacleCount: 10, jumpCount: 2, shortcutCount: 2,
    weatherOptions: [{ weather: 'clear', weight: 9 }, { weather: 'rain', weight: 1 }],
    timeOfDay: 'dusk', unlockLevel: 8,
  },
  {
    id: 'frostbite_alpine', name: 'Frostbite Alpine', theme: 'snow',
    description: 'Icy hairpins demand a delicate throttle and confident grip.',
    laps: 3, pointCount: 10, radiusX: 1350, radiusY: 1050, irregularity: 0.3, angleJitter: 0.24,
    baseWidth: 200, obstacleCount: 12, jumpCount: 1, shortcutCount: 1,
    weatherOptions: [{ weather: 'snow', weight: 7 }, { weather: 'clear', weight: 3 }],
    timeOfDay: 'day', unlockLevel: 10,
  },
  {
    id: 'ember_caldera', name: 'Ember Caldera', theme: 'volcano',
    description: 'A molten circuit skirting the rim of an active volcano.',
    laps: 3, pointCount: 10, radiusX: 1400, radiusY: 1100, irregularity: 0.3, angleJitter: 0.26,
    baseWidth: 210, obstacleCount: 12, jumpCount: 3, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 6 }, { weather: 'fog', weight: 4 }],
    timeOfDay: 'night', unlockLevel: 13,
  },
  {
    id: 'neon_district', name: 'Neon District', theme: 'nightcity',
    description: 'Rain-slicked neon streets under a permanent midnight sky.',
    laps: 4, pointCount: 11, radiusX: 1450, radiusY: 1050, irregularity: 0.26, angleJitter: 0.24,
    baseWidth: 210, obstacleCount: 14, jumpCount: 0, shortcutCount: 3,
    weatherOptions: [{ weather: 'rain', weight: 6 }, { weather: 'clear', weight: 4 }],
    timeOfDay: 'night', unlockLevel: 16,
  },
  {
    id: 'sunrise_highway', name: 'Sunrise Highway', theme: 'highway',
    description: 'Wide, flowing multi-lane highway built for flat-out speed.',
    laps: 4, pointCount: 8, radiusX: 1900, radiusY: 1000, irregularity: 0.14, angleJitter: 0.12,
    baseWidth: 300, obstacleCount: 8, jumpCount: 1, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 8 }, { weather: 'fog', weight: 2 }],
    timeOfDay: 'day', unlockLevel: 3,
  },
  {
    id: 'ironworks_yard', name: 'Ironworks Yard', theme: 'industrial',
    description: 'A gritty former factory complex full of crates and tight chicanes.',
    laps: 3, pointCount: 12, radiusX: 1300, radiusY: 1000, irregularity: 0.32, angleJitter: 0.3,
    baseWidth: 190, obstacleCount: 18, jumpCount: 1, shortcutCount: 2,
    weatherOptions: [{ weather: 'clear', weight: 7 }, { weather: 'rain', weight: 3 }],
    timeOfDay: 'dusk', unlockLevel: 19,
  },
  {
    id: 'redrock_canyon', name: 'Redrock Canyon', theme: 'canyon',
    description: 'Carved canyon walls funnel you through blind, fast corners.',
    laps: 3, pointCount: 10, radiusX: 1550, radiusY: 1150, irregularity: 0.3, angleJitter: 0.24,
    baseWidth: 220, obstacleCount: 12, jumpCount: 2, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 9 }, { weather: 'sandstorm', weight: 1 }],
    timeOfDay: 'day', unlockLevel: 22,
  },
  {
    id: 'harbor_lights', name: 'Harbor Lights', theme: 'harbor',
    description: 'Dockside racing among cranes, containers, and moored freighters.',
    laps: 3, pointCount: 11, radiusX: 1400, radiusY: 1000, irregularity: 0.26, angleJitter: 0.22,
    baseWidth: 210, obstacleCount: 14, jumpCount: 0, shortcutCount: 2,
    weatherOptions: [{ weather: 'rain', weight: 5 }, { weather: 'fog', weight: 3 }, { weather: 'clear', weight: 2 }],
    timeOfDay: 'night', unlockLevel: 25,
  },
  {
    id: 'runway_grid', name: 'Runway Grid', theme: 'airport',
    description: 'Wide open tarmac laid out for maximum top speed and long braking zones.',
    laps: 4, pointCount: 8, radiusX: 1800, radiusY: 1300, irregularity: 0.12, angleJitter: 0.1,
    baseWidth: 320, obstacleCount: 8, jumpCount: 0, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 7 }, { weather: 'fog', weight: 3 }],
    timeOfDay: 'day', unlockLevel: 28,
  },
  {
    id: 'colosseum_arena', name: 'Colosseum Arena', theme: 'stadium',
    description: 'A packed stadium circuit built for tight door-to-door racing.',
    laps: 5, pointCount: 9, radiusX: 1100, radiusY: 850, irregularity: 0.2, angleJitter: 0.18,
    baseWidth: 230, obstacleCount: 10, jumpCount: 1, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 10 }],
    timeOfDay: 'night', unlockLevel: 32,
  },
  {
    id: 'rolling_hills', name: 'Rolling Hills', theme: 'countryside',
    description: 'Long, flowing countryside roads through farmland and orchards.',
    laps: 3, pointCount: 10, radiusX: 1650, radiusY: 1150, irregularity: 0.24, angleJitter: 0.2,
    baseWidth: 230, obstacleCount: 10, jumpCount: 2, shortcutCount: 2,
    weatherOptions: [{ weather: 'clear', weight: 7 }, { weather: 'rain', weight: 3 }],
    timeOfDay: 'day', unlockLevel: 12,
  },
  {
    id: 'grand_prix_street', name: 'Monteverde Street Grand Prix', theme: 'f1street',
    description: 'A tight, unforgiving street circuit lined with barriers — precision over power.',
    laps: 4, pointCount: 13, radiusX: 1300, radiusY: 950, irregularity: 0.4, angleJitter: 0.34,
    baseWidth: 170, obstacleCount: 0, jumpCount: 0, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 8 }, { weather: 'rain', weight: 2 }],
    timeOfDay: 'day', unlockLevel: 7,
  },
  {
    id: 'grand_prix_speedway', name: 'Velocity Park Grand Prix', theme: 'f1speed',
    description: 'A flowing, high-speed grand prix circuit built for flat-out top speed.',
    laps: 5, pointCount: 9, radiusX: 2000, radiusY: 1300, irregularity: 0.16, angleJitter: 0.14,
    baseWidth: 240, obstacleCount: 0, jumpCount: 0, shortcutCount: 1,
    weatherOptions: [{ weather: 'clear', weight: 9 }, { weather: 'rain', weight: 1 }],
    timeOfDay: 'day', unlockLevel: 15,
  },
];

function buildTrack(seed: TrackSeed): TrackDefinition {
  const controlPoints = generateLoopControlPoints({
    seed: seed.id,
    pointCount: seed.pointCount,
    baseRadiusX: seed.radiusX,
    baseRadiusY: seed.radiusY,
    irregularity: seed.irregularity,
    angleJitter: seed.angleJitter,
  });
  const smoothed = buildClosedSpline(controlPoints, 14);
  const approxLength = pathLength(smoothed, true);
  const obstacleTypes = THEME_OBSTACLES[seed.theme];

  return {
    id: seed.id,
    name: seed.name,
    theme: seed.theme,
    description: seed.description,
    laps: seed.laps,
    controlPoints,
    baseWidth: seed.baseWidth,
    obstacles: scatterObstacles({
      seed: seed.id,
      count: seed.obstacleCount,
      types: obstacleTypes,
      avoidStart: 0.02,
      minRadius: 16,
      maxRadius: 30,
    }),
    jumps: generateJumps(seed.id, seed.jumpCount),
    shortcuts: generateShortcuts(seed.id, seed.shortcutCount),
    weatherOptions: seed.weatherOptions,
    timeOfDay: seed.timeOfDay,
    unlockLevel: seed.unlockLevel,
    palette: THEME_PALETTES[seed.theme],
    targetLapTime: Math.round((approxLength / 620) * 10) / 10,
  };
}

export const TRACK_DATA: TrackDefinition[] = SEEDS.map(buildTrack);

export function getTrackById(id: string): TrackDefinition | undefined {
  return TRACK_DATA.find((t) => t.id === id);
}

export function getDefaultTrackId(): string {
  return TRACK_DATA[0].id;
}
