import type { TrackDefinition, TrackShortcut } from './TrackTypes';
import { buildClosedSpline, cumulativeDistances, distance, pathLength, type Vec2 } from '../utils/MathUtils';

export interface TrackSample {
  point: Vec2;
  tangent: Vec2; // normalized direction of travel
  normal: Vec2; // normalized left-hand perpendicular
  width: number; // track width at this point
}

/**
 * Wraps a TrackDefinition with dense sampled geometry and provides the query
 * API used by physics (off-track detection), AI (racing line + curvature),
 * and lap/checkpoint tracking. Pure logic — no rendering, no Phaser types.
 */
export class TrackGeometry {
  readonly def: TrackDefinition;
  readonly densePoints: Vec2[];
  readonly cumulative: number[];
  readonly totalLength: number;
  readonly checkpoints: number[];

  constructor(def: TrackDefinition, samplesPerSegment = 14) {
    this.def = def;
    this.densePoints = buildClosedSpline(def.controlPoints, samplesPerSegment);
    this.cumulative = cumulativeDistances([...this.densePoints, this.densePoints[0]]);
    this.totalLength = pathLength(this.densePoints, true);
    const checkpointCount = 8;
    this.checkpoints = Array.from({ length: checkpointCount }, (_, i) => i / checkpointCount);
  }

  private indexAtProgress(progress: number): number {
    const p = ((progress % 1) + 1) % 1;
    return Math.floor(p * this.densePoints.length) % this.densePoints.length;
  }

  getPointAtProgress(progress: number): Vec2 {
    const p = ((progress % 1) + 1) % 1;
    const scaled = p * this.densePoints.length;
    const i0 = Math.floor(scaled) % this.densePoints.length;
    const i1 = (i0 + 1) % this.densePoints.length;
    const t = scaled - Math.floor(scaled);
    const a = this.densePoints[i0];
    const b = this.densePoints[i1];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  getTangentAtProgress(progress: number): Vec2 {
    const i0 = this.indexAtProgress(progress);
    const i1 = (i0 + 1) % this.densePoints.length;
    const a = this.densePoints[i0];
    const b = this.densePoints[i1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  getNormalAtProgress(progress: number): Vec2 {
    const t = this.getTangentAtProgress(progress);
    return { x: -t.y, y: t.x };
  }

  getWidthAtProgress(progress: number): number {
    let width = this.def.baseWidth;
    for (const shortcut of this.def.shortcuts) {
      if (this.isWithinRange(progress, shortcut)) {
        width *= shortcut.widthMultiplier;
      }
    }
    return width;
  }

  private isWithinRange(progress: number, range: { start: number; end: number }): boolean {
    const p = ((progress % 1) + 1) % 1;
    if (range.start <= range.end) return p >= range.start && p <= range.end;
    return p >= range.start || p <= range.end; // wraps around 0
  }

  isInJump(progress: number): { active: boolean; height: number; t: number } {
    for (const jump of this.def.jumps) {
      if (this.isWithinRange(progress, jump)) {
        const span = jump.end - jump.start;
        const p = ((progress % 1) + 1) % 1;
        const local = span > 0 ? (p - jump.start) / span : 0;
        const t = Math.sin(Math.PI * Math.max(0, Math.min(1, local)));
        return { active: true, height: jump.height, t };
      }
    }
    return { active: false, height: 0, t: 0 };
  }

  isInShortcut(progress: number): TrackShortcut | undefined {
    return this.def.shortcuts.find((s) => this.isWithinRange(progress, s));
  }

  /**
   * Finds the closest point on the track centerline to `pos`, returning progress
   * (0-1), signed lateral offset (world units, +right/-left relative to travel
   * direction), and distance from center. Uses a coarse-then-fine search for speed.
   */
  worldToTrack(pos: Vec2): { progress: number; lateralOffset: number; distanceFromCenter: number } {
    let bestIdx = 0;
    let bestDistSq = Infinity;
    const step = Math.max(1, Math.floor(this.densePoints.length / 64));
    for (let i = 0; i < this.densePoints.length; i += step) {
      const d = distSq(this.densePoints[i], pos);
      if (d < bestDistSq) {
        bestDistSq = d;
        bestIdx = i;
      }
    }
    const searchRadius = step * 2;
    for (let i = bestIdx - searchRadius; i <= bestIdx + searchRadius; i++) {
      const idx = ((i % this.densePoints.length) + this.densePoints.length) % this.densePoints.length;
      const d = distSq(this.densePoints[idx], pos);
      if (d < bestDistSq) {
        bestDistSq = d;
        bestIdx = idx;
      }
    }

    const progress = bestIdx / this.densePoints.length;
    const closest = this.densePoints[bestIdx];
    const tangent = this.getTangentAtProgress(progress);
    const dx = pos.x - closest.x;
    const dy = pos.y - closest.y;
    // signed lateral: cross product of tangent and offset vector
    const lateralOffset = tangent.x * dy - tangent.y * dx;
    return { progress, lateralOffset, distanceFromCenter: Math.hypot(dx, dy) };
  }

  isOffTrack(pos: Vec2): boolean {
    const { progress, distanceFromCenter } = this.worldToTrack(pos);
    return distanceFromCenter > this.getWidthAtProgress(progress) / 2;
  }

  /** Average curvature over a lookahead window, used by AI to pick braking points & racing line offset. */
  getCurvatureAhead(progress: number, lookahead = 0.03, samples = 5): number {
    let total = 0;
    for (let i = 1; i <= samples; i++) {
      const p0 = progress + (lookahead * (i - 1)) / samples;
      const p1 = progress + (lookahead * i) / samples;
      const t0 = this.getTangentAtProgress(p0);
      const t1 = this.getTangentAtProgress(p1);
      const cross = t0.x * t1.y - t0.y * t1.x;
      total += cross;
    }
    return total / samples;
  }

  distanceBetween(progressA: number, progressB: number): number {
    let diff = ((progressB - progressA) % 1 + 1) % 1;
    return diff * this.totalLength;
  }
}

function distSq(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}
