import { seededRng } from '../utils/RNG';

/** Standard racing points table: index 0 = 1st place. */
export const TOURNAMENT_POINTS = [12, 10, 8, 6, 5, 4, 3, 2, 1];

export function pointsForPosition(position: number): number {
  return TOURNAMENT_POINTS[position - 1] ?? 0;
}

export interface TournamentState {
  round: number; // 1-based current round
  totalRounds: number;
  trackIds: string[];
  pointsSoFar: number; // points accumulated BEFORE this round
}

export const TOURNAMENT_ROUNDS = 3;

/** Picks `count` distinct tracks from the unlocked pool (repeats only if the pool is smaller). */
export function generateTournamentTrackIds(unlockedTrackIds: string[], count: number, seed: number | string): string[] {
  const rng = seededRng(seed);
  const pool = [...unlockedTrackIds].sort(() => rng() - 0.5);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[i % pool.length]);
  }
  return result;
}

export function maxPossiblePoints(totalRounds: number): number {
  return TOURNAMENT_POINTS[0] * totalRounds;
}
