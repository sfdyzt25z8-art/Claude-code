import type { VehiclePerformance } from '../cars/CarPerformance';
import { clamp, lerpAngle, type Vec2 } from '../utils/MathUtils';

export interface VehicleInput {
  throttle: number; // -1 (full brake/reverse) .. 1 (full accelerate)
  steer: number; // -1 (left) .. 1 (right)
  handbrake: boolean;
  nitro: boolean;
}

export interface VehicleState {
  position: Vec2;
  velocity: Vec2;
  heading: number; // radians, 0 = facing +x
  isDrifting: boolean;
  driftAngle: number; // signed angle between heading and velocity, for FX/scoring
  driftDuration: number;
  driftScoreAccum: number;
  nitroFuel: number;
  nitroCapacity: number;
  nitroActive: boolean;
  airTime: number;
  jumpHeight: number; // visual height offset, 0 = grounded
  suspension: number; // visual squash/stretch signal, settles to 0
  damage: number; // 0..1
  offTrackTime: number;
  crashCooldown: number;
  totalDistance: number;
}

export function createVehicleState(position: Vec2, heading: number, perf: VehiclePerformance): VehicleState {
  return {
    position: { ...position },
    velocity: { x: 0, y: 0 },
    heading,
    isDrifting: false,
    driftAngle: 0,
    driftDuration: 0,
    driftScoreAccum: 0,
    nitroFuel: perf.nitroCapacity,
    nitroCapacity: perf.nitroCapacity,
    nitroActive: false,
    airTime: 0,
    jumpHeight: 0,
    suspension: 0,
    damage: 0,
    offTrackTime: 0,
    crashCooldown: 0,
    totalDistance: 0,
  };
}

export interface VehicleUpdateContext {
  isOffTrack: boolean;
  jump: { active: boolean; height: number; t: number };
  dt: number;
}

const GRAVITY_SETTLE = 10; // suspension spring-back speed
const OFF_TRACK_GRIP_MULT = 0.55;
const OFF_TRACK_SPEED_MULT = 0.62;

/**
 * Advances a vehicle's simulation state by `dt` seconds. Uses a
 * heading/velocity-separation drift model: steering rotates the car's
 * heading directly, while the actual velocity vector chases that heading at
 * a rate governed by tire grip. When grip is low (handbrake, drift-tuned
 * cars, wet/off-track surfaces) the velocity vector lags behind the heading,
 * producing a natural power-slide.
 */
export function updateVehicle(
  state: VehicleState,
  perf: VehiclePerformance,
  input: VehicleInput,
  ctx: VehicleUpdateContext,
): void {
  const { dt } = ctx;
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  const speedFrac = clamp(speed / perf.maxSpeed, 0, 1.4);

  // --- Air state (jumps) ---
  if (ctx.jump.active) {
    state.airTime += dt;
    state.jumpHeight = ctx.jump.t * ctx.jump.height;
  } else if (state.airTime > 0) {
    // landing
    state.airTime = 0;
    state.suspension = -0.5 - clamp(state.jumpHeight / 80, 0, 1) * 0.6;
    state.jumpHeight = 0;
  } else {
    state.jumpHeight = 0;
  }
  const inAir = ctx.jump.active;
  const steerAuthority = inAir ? 0.35 : 1; // limited air control

  // --- Nitro ---
  state.nitroActive = input.nitro && state.nitroFuel > 0.05 && !inAir;
  if (state.nitroActive) {
    state.nitroFuel = Math.max(0, state.nitroFuel - dt);
  } else if (!input.nitro) {
    state.nitroFuel = Math.min(state.nitroCapacity, state.nitroFuel + dt * 0.18);
  }

  // --- Longitudinal (throttle/brake) ---
  const forward = { x: Math.cos(state.heading), y: Math.sin(state.heading) };
  const forwardSpeed = state.velocity.x * forward.x + state.velocity.y * forward.y;
  let targetAccel = 0;
  const surfaceSpeedMult = ctx.isOffTrack ? OFF_TRACK_SPEED_MULT : 1;
  const maxSpeed = perf.maxSpeed * surfaceSpeedMult * (state.nitroActive ? 1.32 : 1);

  if (input.throttle > 0) {
    targetAccel = perf.acceleration * input.throttle * (forwardSpeed < 0 ? 2.2 : 1);
    if (state.nitroActive) targetAccel += perf.nitroForce;
  } else if (input.throttle < 0) {
    if (forwardSpeed > 5) {
      targetAccel = perf.brakeDecel * input.throttle; // negative = decelerate
    } else {
      targetAccel = perf.acceleration * 0.55 * input.throttle; // reverse
    }
  }

  // Rolling resistance / drag
  const drag = 0.25 + speedFrac * 0.35;

  const newForwardSpeed = clamp(
    forwardSpeed + targetAccel * dt - forwardSpeed * drag * dt,
    -maxSpeed * 0.45,
    maxSpeed,
  );

  // --- Steering (heading always rotates toward input; velocity direction chases via grip) ---
  const speedForSteer = clamp(Math.abs(forwardSpeed) / 260, 0.12, 1);
  const turnDirection = forwardSpeed < -2 ? -1 : 1;
  state.heading += input.steer * perf.turnRate * speedForSteer * turnDirection * steerAuthority * dt;

  const wantsDrift = input.handbrake || (Math.abs(input.steer) > 0.6 && speedFrac > 0.45 && Math.abs(forwardSpeed) > 140);
  const grip = inAir ? 0.05 : wantsDrift ? perf.driftGrip * (ctx.isOffTrack ? OFF_TRACK_GRIP_MULT : 1) : perf.grip * (ctx.isOffTrack ? OFF_TRACK_GRIP_MULT : 1);

  // Recompose velocity: blend current velocity direction toward heading at `grip` rate,
  // magnitude comes from newForwardSpeed (plus a bit of retained lateral momentum while drifting).
  const currentAngle = speed > 4 ? Math.atan2(state.velocity.y, state.velocity.x) : state.heading;
  const targetAngle = state.heading;
  const blend = clamp(grip * 6 * dt, 0, 1);
  const newAngle = lerpAngle(currentAngle, targetAngle, blend);

  const retainedSpeed = speed > 4 ? speed : Math.abs(newForwardSpeed);
  const blendedSpeed = Math.abs(newForwardSpeed) * 0.55 + retainedSpeed * 0.45;
  const signedSpeed = newForwardSpeed < 0 ? -blendedSpeed : blendedSpeed;

  state.velocity = { x: Math.cos(newAngle) * signedSpeed, y: Math.sin(newAngle) * signedSpeed };
  state.position.x += state.velocity.x * dt;
  state.position.y += state.velocity.y * dt;
  state.totalDistance += Math.abs(signedSpeed) * dt;

  // --- Drift bookkeeping (for scoring + FX) ---
  const angleDelta = angleBetween(newAngle, state.heading);
  const drifting = !inAir && Math.abs(angleDelta) > 0.18 && speedFrac > 0.3;
  state.isDrifting = drifting;
  state.driftAngle = angleDelta;
  if (drifting) {
    state.driftDuration += dt;
    state.driftScoreAccum += speedFrac * Math.abs(angleDelta) * dt * 100;
  } else {
    state.driftDuration = 0;
  }

  // --- Suspension settle (visual only) ---
  state.suspension += (0 - state.suspension) * Math.min(1, GRAVITY_SETTLE * dt);

  // --- Off-track tracking ---
  state.offTrackTime = ctx.isOffTrack ? state.offTrackTime + dt : 0;

  if (state.crashCooldown > 0) state.crashCooldown = Math.max(0, state.crashCooldown - dt);
}

function angleBetween(a: number, b: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function applyCrashImpulse(state: VehicleState, impulse: Vec2, damage: number): void {
  state.velocity.x += impulse.x;
  state.velocity.y += impulse.y;
  state.damage = clamp(state.damage + damage, 0, 1);
  state.crashCooldown = 0.35;
  state.suspension = clamp(state.suspension - 0.8, -1.4, 1.4);
}

export function getSpeedKmh(state: VehicleState): number {
  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  // world px/s -> arbitrary but consistent km/h-feeling scale for the HUD
  return Math.round(speed * 0.6);
}
