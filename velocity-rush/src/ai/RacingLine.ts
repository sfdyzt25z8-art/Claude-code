import type { TrackGeometry } from '../tracks/TrackGeometry';
import { clamp } from '../utils/MathUtils';

/**
 * Computes a lateral offset (-1..1, fraction of half-width) that approximates
 * a "racing line": hug the inside of the upcoming apex, drift wide on the
 * straight leading into it. Curvature sign tells us which way the corner bends.
 */
export function racingLineOffset(geo: TrackGeometry, progress: number, lookahead = 0.05): number {
  const curvature = geo.getCurvatureAhead(progress, lookahead, 6);
  // Positive curvature = track bends one way; bias toward the inside (negative offset relative to bend).
  const targetOffset = clamp(-curvature * 14, -0.72, 0.72);
  return targetOffset;
}

export function brakingFactor(geo: TrackGeometry, progress: number, lookahead: number): number {
  // Sample curvature further ahead to anticipate corners before they're visually "here".
  const curvature = Math.abs(geo.getCurvatureAhead(progress, lookahead, 8));
  return clamp(curvature * 22, 0, 1);
}
