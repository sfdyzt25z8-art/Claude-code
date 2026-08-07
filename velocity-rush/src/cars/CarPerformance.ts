import type { CarBaseStats, CarDefinition } from './CarTypes';
import { UPGRADE_DATA } from '../upgrades/UpgradeData';
import type { CarUpgradeState } from '../upgrades/UpgradeTypes';
import { clamp } from '../utils/MathUtils';

/** Real-world physics parameters derived from 0-100 design stats. */
export interface VehiclePerformance {
  maxSpeed: number; // px/s (world units) — the physics layer's speed cap
  acceleration: number; // px/s^2 forward acceleration
  brakeDecel: number; // px/s^2 braking deceleration
  turnRate: number; // rad/s at reference speed
  grip: number; // 0-1 lateral traction coefficient
  driftGrip: number; // 0-1 lateral traction coefficient while drifting (handbrake/oversteer)
  nitroForce: number; // px/s^2 extra acceleration while boosting
  nitroCapacity: number; // seconds of nitro at full tank
  mass: number; // relative mass, affects collision response & momentum
}

/** Converts 0-100 design stats (post-upgrade) into simulation-ready numbers. */
export function computePerformance(stats: CarBaseStats): VehiclePerformance {
  const topSpeed = clamp(stats.topSpeed, 5, 140);
  const accel = clamp(stats.acceleration, 5, 140);
  const braking = clamp(stats.braking, 5, 140);
  const handling = clamp(stats.handling, 5, 140);
  const grip = clamp(stats.grip, 5, 140);
  const nitro = clamp(stats.nitroPower, 5, 140);
  const weight = clamp(stats.weight, 10, 140);

  return {
    maxSpeed: 260 + topSpeed * 6.4,
    acceleration: 140 + accel * 5.2 - weight * 0.6,
    brakeDecel: 260 + braking * 6.0,
    turnRate: 1.6 + (handling / 100) * 2.6,
    grip: clamp(0.35 + (grip / 100) * 0.6, 0.2, 1),
    driftGrip: clamp(0.18 + (grip / 100) * 0.32, 0.1, 0.6),
    nitroForce: 180 + nitro * 4.4,
    nitroCapacity: 2.2 + (nitro / 100) * 3.2,
    mass: 0.7 + (weight / 100) * 0.9,
  };
}

/** Applies purchased upgrade tiers on top of a car's base stats. */
export function applyUpgrades(base: CarBaseStats, upgrades: CarUpgradeState): CarBaseStats {
  const result: CarBaseStats = { ...base };
  for (const def of UPGRADE_DATA) {
    const level = upgrades[def.category] ?? 0;
    if (level <= 0) continue;
    const tier = def.tiers[Math.min(level, def.tiers.length) - 1];
    if (!tier) continue;
    for (const [key, value] of Object.entries(tier.effect) as [keyof CarBaseStats, number][]) {
      result[key] = clamp((result[key] ?? 0) + value, 0, 140);
    }
  }
  return result;
}

/** Full pipeline: car definition + upgrade state -> simulation-ready performance. */
export function getCarPerformance(car: CarDefinition, upgrades: CarUpgradeState): VehiclePerformance {
  return computePerformance(applyUpgrades(car.stats, upgrades));
}
