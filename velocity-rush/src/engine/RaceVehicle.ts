import type { CarDefinition } from '../cars/CarTypes';
import type { VehiclePerformance } from '../cars/CarPerformance';
import type { VehicleState } from '../physics/VehiclePhysics';
import type { AIController } from '../ai/AIController';
import type { CarVisual } from '../ui/CarPreview';
import type { TrackGeometry } from '../tracks/TrackGeometry';

/**
 * Everything about a race participant except how it's rendered. Deliberately
 * has zero dependency on Phaser (or any other rendering engine) so the same
 * lap/standings logic below works for both the 2D Phaser race view
 * (`RaceVehicle`, which adds a Phaser `visual`) and the 3D Three.js race view
 * (`src/three/RaceVehicle3D.ts`, which adds a `THREE.Group` mesh instead).
 */
export interface RaceVehicleCore {
  id: string;
  isPlayer: boolean;
  isPolice?: boolean;
  car: CarDefinition;
  perf: VehiclePerformance;
  state: VehicleState;
  radius: number;
  ai?: AIController;
  lap: number;
  checkpointsPassed: Set<number>;
  lastCheckpointIndex: number;
  lastProgress: number;
  finished: boolean;
  finishTimeMs: number | null;
  lapTimes: number[];
  currentLapStartMs: number;
  bestLapTimeMs: number | null;
  crashCount: number;
  totalRaceProgress: number; // laps completed + fractional progress, used for ranking
}

export interface RaceVehicle extends RaceVehicleCore {
  visual: CarVisual;
}

/**
 * Call once per frame per vehicle after its physics state has been updated.
 * Tracks sequential checkpoint passage (to prevent lap-skipping) and detects
 * lap completion. Returns true if a lap was just completed.
 */
export function updateLapTracking<T extends RaceVehicleCore>(vehicle: T, geo: TrackGeometry, nowMs: number): boolean {
  const { progress } = geo.worldToTrack(vehicle.state.position);
  const checkpointCount = geo.checkpoints.length;
  const currentCheckpoint = Math.floor(progress * checkpointCount);

  // Shortest signed progress delta since the last sample, wrap-aware (handles the 1→0
  // crossing at the start/finish line). Positive = moving forward around the loop, however
  // large the step — this is what lets a single big physics step (a frame hitch, or just a
  // very fast car) still register every checkpoint it swept through, instead of silently
  // skipping them and leaving the lap impossible to ever complete. Negative = reversing,
  // which must never count toward completing checkpoints (that would let a player fake a
  // lap by tapping reverse across the finish line).
  let delta = progress - vehicle.lastProgress;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;

  if (currentCheckpoint !== vehicle.lastCheckpointIndex && delta > 0) {
    const forwardDelta = (currentCheckpoint - vehicle.lastCheckpointIndex + checkpointCount) % checkpointCount;
    for (let i = 1; i <= forwardDelta; i++) {
      vehicle.checkpointsPassed.add((vehicle.lastCheckpointIndex + i) % checkpointCount);
    }
  }
  vehicle.lastCheckpointIndex = currentCheckpoint;
  vehicle.lastProgress = progress;

  const wrappedToStart = progress < 0.05 && delta > 0 && vehicle.checkpointsPassed.size >= checkpointCount - 1;
  vehicle.totalRaceProgress = vehicle.lap + progress;

  if (wrappedToStart) {
    const lapTime = nowMs - vehicle.currentLapStartMs;
    vehicle.lapTimes.push(lapTime);
    if (vehicle.bestLapTimeMs === null || lapTime < vehicle.bestLapTimeMs) vehicle.bestLapTimeMs = lapTime;
    vehicle.lap += 1;
    vehicle.currentLapStartMs = nowMs;
    vehicle.checkpointsPassed.clear();
    vehicle.totalRaceProgress = vehicle.lap + progress;
    return true;
  }
  return false;
}

/** Ranks vehicles by total race progress (laps + track position), leader first. */
export function computeStandings<T extends RaceVehicleCore>(vehicles: T[]): T[] {
  return [...vehicles].sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    if (a.finished && b.finished) return (a.finishTimeMs ?? 0) - (b.finishTimeMs ?? 0);
    return b.totalRaceProgress - a.totalRaceProgress;
  });
}
