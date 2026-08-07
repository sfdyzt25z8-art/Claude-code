import { seededRng } from '../utils/RNG';
import type { Vec2 } from '../utils/MathUtils';
import type { ObstacleType, TrackJumpZone, TrackObstacle, TrackShortcut } from './TrackTypes';

export interface LoopShapeParams {
  seed: number | string;
  pointCount: number; // number of sparse control points around the loop
  baseRadiusX: number;
  baseRadiusY: number;
  irregularity: number; // 0-1, how much radius varies per point
  angleJitter: number; // 0-1, how much angle spacing varies
}

/**
 * Procedurally generates a closed, non-self-intersecting-ish loop of sparse
 * control points by walking around a circle with randomised radius/angle
 * jitter. Smoothed later via buildClosedSpline (Catmull-Rom).
 */
export function generateLoopControlPoints(params: LoopShapeParams): Vec2[] {
  const rng = seededRng(params.seed);
  const { pointCount, baseRadiusX, baseRadiusY, irregularity, angleJitter } = params;
  const points: Vec2[] = [];
  const baseAngleStep = (Math.PI * 2) / pointCount;

  let angle = 0;
  for (let i = 0; i < pointCount; i++) {
    const radiusNoise = 1 + (rng() * 2 - 1) * irregularity;
    const r = { x: baseRadiusX * radiusNoise, y: baseRadiusY * radiusNoise };
    points.push({ x: Math.cos(angle) * r.x, y: Math.sin(angle) * r.y });
    angle += baseAngleStep * (1 + (rng() * 2 - 1) * angleJitter);
  }
  return points;
}

interface ScatterParams {
  seed: number | string;
  count: number;
  types: ObstacleType[];
  avoidStart: number; // progress window around 0 (start/finish) kept clear
  minRadius: number;
  maxRadius: number;
}

export function scatterObstacles(params: ScatterParams): TrackObstacle[] {
  const rng = seededRng(params.seed);
  const obstacles: TrackObstacle[] = [];
  let attempts = 0;
  while (obstacles.length < params.count && attempts < params.count * 6) {
    attempts++;
    const at = rng();
    if (at < params.avoidStart || at > 1 - params.avoidStart) continue;
    const offset = (rng() * 2 - 1) * 0.75;
    const type = params.types[Math.floor(rng() * params.types.length)];
    const radius = params.minRadius + rng() * (params.maxRadius - params.minRadius);
    obstacles.push({ at, offset, type, radius });
  }
  return obstacles.sort((a, b) => a.at - b.at);
}

export function generateJumps(seed: number | string, count: number): TrackJumpZone[] {
  const rng = seededRng(seed);
  const jumps: TrackJumpZone[] = [];
  for (let i = 0; i < count; i++) {
    const start = 0.08 + rng() * 0.84;
    const length = 0.02 + rng() * 0.025;
    jumps.push({ start, end: Math.min(0.99, start + length), height: 60 + rng() * 60 });
  }
  return jumps.sort((a, b) => a.start - b.start);
}

export function generateShortcuts(seed: number | string, count: number): TrackShortcut[] {
  const rng = seededRng(seed + '-shortcut');
  const shortcuts: TrackShortcut[] = [];
  for (let i = 0; i < count; i++) {
    const start = 0.1 + rng() * 0.75;
    const length = 0.06 + rng() * 0.05;
    shortcuts.push({ start, end: Math.min(0.98, start + length), widthMultiplier: 1.7 + rng() * 0.6 });
  }
  return shortcuts.sort((a, b) => a.start - b.start);
}
