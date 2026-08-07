import type { TrackGeometry } from '../tracks/TrackGeometry';
import type { VehicleInput, VehicleState } from '../physics/VehiclePhysics';
import type { VehiclePerformance } from '../cars/CarPerformance';
import { DIFFICULTY_SETTINGS, type Difficulty } from '../utils/Constants';
import { brakingFactor, racingLineOffset } from './RacingLine';
import { clamp, distance, type Vec2 } from '../utils/MathUtils';

export interface AIVehicleRef {
  id: string;
  state: VehicleState;
  perf: VehiclePerformance;
  radius: number;
}

export interface AIObstacleRef {
  position: Vec2;
  radius: number;
}

/**
 * Drives a single AI-controlled car. Follows the procedural racing line,
 * brakes for upcoming curvature, avoids obstacles, attempts overtakes,
 * defends its position, uses nitro tactically, and recovers from crashes —
 * all tuned by a difficulty profile plus a small amount of per-driver
 * randomised "personality" so a full grid doesn't feel robotic.
 */
export class AIController {
  private mistakeTimer = 0;
  private mistakeSteerOffset = 0;
  private stuckTimer = 0;
  private recoveryTimer = 0;
  private readonly personality: { aggression: number; lineNoise: number; nitroEagerness: number };

  constructor(
    private geo: TrackGeometry,
    private difficulty: Difficulty,
    rng: () => number,
  ) {
    this.personality = {
      aggression: 0.6 + rng() * 0.4,
      lineNoise: rng() * 0.12,
      nitroEagerness: 0.4 + rng() * 0.6,
    };
  }

  computeInput(
    self: AIVehicleRef,
    opponents: AIVehicleRef[],
    obstacles: AIObstacleRef[],
    dt: number,
    leaderProgressGap: number,
  ): VehicleInput {
    const settings = DIFFICULTY_SETTINGS[this.difficulty];
    const { progress } = this.geo.worldToTrack(self.state.position);
    const speed = Math.hypot(self.state.velocity.x, self.state.velocity.y);

    // --- Recovery: stuck / flipped detection ---
    if (speed < 25 && !this.isNearRaceStart(self)) {
      this.stuckTimer += dt;
    } else {
      this.stuckTimer = Math.max(0, this.stuckTimer - dt * 2);
    }
    if (this.stuckTimer > 0.9) this.recoveryTimer = 1.2;
    if (this.recoveryTimer > 0) {
      this.recoveryTimer -= dt;
      const target = this.geo.getPointAtProgress(progress + 0.02);
      const angleToTarget = Math.atan2(target.y - self.state.position.y, target.x - self.state.position.x);
      const steer = clamp(shortestAngle(self.state.heading, angleToTarget) * 1.5, -1, 1);
      return { throttle: -1, steer: -steer, handbrake: false, nitro: false };
    }

    // --- Mistakes (difficulty-scaled human-like error) ---
    this.mistakeTimer -= dt;
    if (this.mistakeTimer <= 0) {
      this.mistakeTimer = 1.5 + Math.random() * 2.5;
      const roll = Math.random();
      this.mistakeSteerOffset = roll < settings.aiMistakeChance ? (Math.random() * 2 - 1) * 0.35 : 0;
    }

    // --- Racing line target with obstacle avoidance ---
    const lookaheadDist = clamp(0.03 + speed / 9000, 0.03, 0.09);
    let laneOffset = racingLineOffset(this.geo, progress, lookaheadDist) + this.mistakeSteerOffset + this.personality.lineNoise;

    laneOffset += this.computeOverlapAvoidance(self, opponents);
    laneOffset += this.computeObstacleAvoidance(self, obstacles, progress);
    laneOffset = clamp(laneOffset, -0.85, 0.85);

    const targetProgress = progress + lookaheadDist;
    const centerPoint = this.geo.getPointAtProgress(targetProgress);
    const normal = this.geo.getNormalAtProgress(targetProgress);
    const width = this.geo.getWidthAtProgress(targetProgress);
    const targetPoint: Vec2 = {
      x: centerPoint.x + normal.x * laneOffset * (width / 2),
      y: centerPoint.y + normal.y * laneOffset * (width / 2),
    };

    const angleToTarget = Math.atan2(targetPoint.y - self.state.position.y, targetPoint.x - self.state.position.x);
    const steerError = shortestAngle(self.state.heading, angleToTarget);
    const steer = clamp(steerError * 2.4, -1, 1);

    // --- Speed management: brake for upcoming curvature ---
    const brake = brakingFactor(this.geo, progress, lookaheadDist * 1.6);
    const speedFrac = clamp(speed / self.perf.maxSpeed, 0, 1.3);
    let throttle = 1;
    if (brake > 0.35 && speedFrac > 0.5) {
      throttle = clamp(1 - brake * 1.6, -0.6, 1);
    }

    // Rubber-banding: nudge effective throttle based on gap to the human leader.
    const rubberBand = settings.aiRubberBand;
    if (leaderProgressGap > 0.02) throttle = clamp(throttle + rubberBand * 0.25, -1, 1);
    else if (leaderProgressGap < -0.05) throttle = clamp(throttle - rubberBand * 0.15, -1, 1);

    // --- Nitro tactics: use on straights, prefer when behind, respect aggression/eagerness ---
    const wantsNitro =
      brake < 0.15 &&
      self.state.nitroFuel > self.perf.nitroCapacity * 0.3 &&
      (leaderProgressGap > 0.01 || Math.random() < 0.002 * this.personality.nitroEagerness) &&
      this.personality.aggression * settings.aiAggression > 0.25;

    // --- Handbrake for sharp corners at speed (drift-style AI cornering) ---
    const handbrake = brake > 0.72 && speedFrac > 0.55 && Math.abs(steer) > 0.5;

    return {
      throttle: clamp(throttle * settings.aiSpeedMultiplier, -1, 1),
      steer,
      handbrake,
      nitro: wantsNitro,
    };
  }

  private isNearRaceStart(self: AIVehicleRef): boolean {
    return self.state.totalDistance < 40;
  }

  private computeOverlapAvoidance(self: AIVehicleRef, opponents: AIVehicleRef[]): number {
    let avoidance = 0;
    for (const opp of opponents) {
      if (opp.id === self.id) continue;
      const d = distance(self.state.position, opp.state.position);
      const threshold = (self.radius + opp.radius) * 6;
      if (d < threshold) {
        const dx = opp.state.position.x - self.state.position.x;
        const dy = opp.state.position.y - self.state.position.y;
        const forward = { x: Math.cos(self.state.heading), y: Math.sin(self.state.heading) };
        const lateral = -forward.y * dx + forward.x * dy; // side of opponent relative to heading
        const strength = (1 - d / threshold) * 0.5 * this.personality.aggression;
        avoidance += lateral > 0 ? -strength : strength;
      }
    }
    return clamp(avoidance, -0.6, 0.6);
  }

  private computeObstacleAvoidance(self: AIVehicleRef, obstacles: AIObstacleRef[], progress: number): number {
    let avoidance = 0;
    const selfPoint = self.state.position;
    for (const obs of obstacles) {
      const d = distance(selfPoint, obs.position);
      const threshold = obs.radius * 8 + 60;
      if (d > threshold) continue;
      const { lateralOffset } = this.geo.worldToTrack(obs.position);
      const width = this.geo.getWidthAtProgress(progress);
      const normalizedOffset = clamp(lateralOffset / (width / 2), -1, 1);
      const strength = (1 - d / threshold) * 0.7;
      avoidance += normalizedOffset > 0 ? -strength : strength;
    }
    return clamp(avoidance, -0.7, 0.7);
  }
}

function shortestAngle(from: number, to: number): number {
  let diff = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}
