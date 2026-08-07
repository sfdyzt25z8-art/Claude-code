import type { Difficulty } from '../utils/Constants';

export type RaceMode =
  | 'quickRace'
  | 'timeTrial'
  | 'career'
  | 'drift'
  | 'checkpoint'
  | 'endless'
  | 'elimination'
  | 'tournament'
  | 'policeChase'
  | 'testDrive'
  | 'multiplayer';

export interface RaceConfig {
  mode: RaceMode;
  trackId: string;
  carId: string;
  difficulty: Difficulty;
  opponentCount: number;
  lapsOverride?: number;
  careerStageId?: string;
  eliminationIntervalSec?: number;
}

export const RACE_MODE_LABEL: Record<RaceMode, string> = {
  quickRace: 'Quick Race',
  timeTrial: 'Time Trial',
  career: 'Career',
  drift: 'Drift Mode',
  checkpoint: 'Checkpoint Mode',
  endless: 'Endless Highway',
  elimination: 'Elimination',
  tournament: 'Tournament',
  policeChase: 'Police Chase',
  testDrive: 'Test Drive',
  multiplayer: 'Multiplayer',
};

export interface RaceResultData {
  config: RaceConfig;
  outcome: 'finished' | 'dnf' | 'eliminated' | 'quit';
  position: number;
  totalRacers: number;
  raceTimeMs: number;
  lapTimes: number[];
  bestLapMs: number | null;
  driftScore: number;
  stuntScore: number;
  distanceMeters: number;
  cleanDriving: boolean;
  coinsEarned: number;
  xpEarned: number;
  trophiesEarned: number;
  rewardBreakdown: { label: string; coins: number; xp: number }[];
  careerStagePassed?: boolean;
  newAchievements: string[];
}

export const RACE_MODE_DESCRIPTIONS: Record<RaceMode, string> = {
  quickRace: 'Standard race against AI opponents. First across the line wins.',
  timeTrial: 'No opponents — chase your best lap against the clock.',
  career: 'Progress through Velocity Rush’s championship ladder.',
  drift: 'Score points by drifting through the course — no finish line, just style.',
  checkpoint: 'Race against the clock through a series of checkpoints.',
  endless: 'Survive an ever-accelerating endless highway. How far can you go?',
  elimination: 'Last place is eliminated at each interval. Don’t be last.',
  tournament: 'A multi-race series — best combined result takes the trophy.',
  policeChase: 'Outrun the law across the circuit while still racing to win.',
  testDrive: 'Free-roam test drive to feel out a car — no scoring.',
  multiplayer: 'Race against other players online.',
};
