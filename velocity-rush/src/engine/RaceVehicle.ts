import type { CarDefinition } from '../cars/CarTypes';
import type { VehiclePerformance } from '../cars/CarPerformance';
import type { VehicleState } from '../physics/VehiclePhysics';
import type { AIController } from '../ai/AIController';
import type { CarVisual } from '../ui/CarPreview';
import type { TrackGeometry } from '../tracks/TrackGeometry';

export interface RaceVehicle {
  id: string;
  isPlayer: boolean;
  isPolice?: boolean;
  car: CarDefinition;
  perf: VehiclePerformance;
  state: VehicleState;
  visual: CarVisual;
  radius: number;
  ai?: AIController;
  lap: number;
  checkpointsPassed: Set<number>;
  lastCheckpointIndex: number;
  finished: boolean;
  finishTimeMs: number | null;
  lapTimes: number[];
  currentLapStartMs: number;
  bestLapTimeMs: number | null;
  crashCount: number;
  totalRaceProgress: number; // laps completed + fractional progress, used for ranking
}

/**
 * Call once per frame per vehicle after its physics state has been updated.
 * Tracks sequential checkpoint passage (to prevent lap-skipping) and detects
 * lap completion. Returns true if a lap was just completed.
 */
export function updateLapTracking(vehicle: RaceVehicle, geo: TrackGeometry, nowMs: number): boolean {
  const { progress } = geo.worldToTrack(vehicle.state.position);
  const checkpointCount = geo.checkpoints.length;
  const currentCheckpoint = Math.floor(progress * checkpointCount);

  if (currentCheckpoint !== vehicle.lastCheckpointIndex) {
    const forwardDelta = (currentCheckpoint - vehicle.lastCheckpointIndex + checkpointCount) % checkpointCount;
    if (forwardDelta === 1 || forwardDelta === 0) {
      vehicle.checkpointsPassed.add(currentCheckpoint);
    }
    vehicle.lastCheckpointIndex = currentCheckpoint;
  }

  const wrappedToStart = progress < 0.05 && vehicle.checkpointsPassed.size >= checkpointCount - 1;
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
export function computeStandings(vehicles: RaceVehicle[]): RaceVehicle[] {
  return [...vehicles].sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? -1 : 1;
    if (a.finished && b.finished) return (a.finishTimeMs ?? 0) - (b.finishTimeMs ?? 0);
    return b.totalRaceProgress - a.totalRaceProgress;
  });
}
