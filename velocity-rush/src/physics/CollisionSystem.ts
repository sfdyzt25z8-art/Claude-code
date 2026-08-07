import type { VehicleState } from './VehiclePhysics';
import { applyCrashImpulse } from './VehiclePhysics';
import type { Vec2 } from '../utils/MathUtils';

export interface CollidableVehicle {
  id: string;
  state: VehicleState;
  radius: number;
  mass: number;
}

export interface StaticObstacleCollider {
  position: Vec2;
  radius: number;
  hard: boolean; // hard obstacles cause a real bounce + damage; soft ones (puddles) don't
}

export interface CrashEvent {
  vehicleId: string;
  otherId: string | 'wall' | 'obstacle';
  severity: number; // 0-1, used to scale crash SFX volume
  position: Vec2;
}

/**
 * Resolves circle-circle collisions between vehicles and between vehicles and
 * static track obstacles. Cheap O(n^2) pass — fine at our vehicle counts (<=12).
 */
export class CollisionSystem {
  resolveVehiclePairs(vehicles: CollidableVehicle[]): CrashEvent[] {
    const events: CrashEvent[] = [];
    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        const a = vehicles[i];
        const b = vehicles[j];
        const dx = b.state.position.x - a.state.position.x;
        const dy = b.state.position.y - a.state.position.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = a.radius + b.radius;
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const totalMass = a.mass + b.mass;

        // Positional correction (push apart proportional to inverse mass)
        const pushA = (overlap * (b.mass / totalMass));
        const pushB = (overlap * (a.mass / totalMass));
        a.state.position.x -= nx * pushA;
        a.state.position.y -= ny * pushA;
        b.state.position.x += nx * pushB;
        b.state.position.y += ny * pushB;

        // Relative velocity along normal
        const rvx = b.state.velocity.x - a.state.velocity.x;
        const rvy = b.state.velocity.y - a.state.velocity.y;
        const relSpeed = rvx * nx + rvy * ny;
        if (relSpeed < 0) {
          const restitution = 0.45;
          const impulseMag = (-(1 + restitution) * relSpeed) / (1 / a.mass + 1 / b.mass);
          const ix = impulseMag * nx;
          const iy = impulseMag * ny;
          if (a.state.crashCooldown <= 0) applyCrashImpulse(a.state, { x: -ix / a.mass, y: -iy / a.mass }, Math.min(0.08, Math.abs(relSpeed) / 4000));
          if (b.state.crashCooldown <= 0) applyCrashImpulse(b.state, { x: ix / b.mass, y: iy / b.mass }, Math.min(0.08, Math.abs(relSpeed) / 4000));

          const severity = Math.min(1, Math.abs(relSpeed) / 900);
          if (severity > 0.08) {
            const midpoint = { x: (a.state.position.x + b.state.position.x) / 2, y: (a.state.position.y + b.state.position.y) / 2 };
            events.push({ vehicleId: a.id, otherId: b.id, severity, position: midpoint });
          }
        }
      }
    }
    return events;
  }

  resolveObstacles(vehicles: CollidableVehicle[], obstacles: StaticObstacleCollider[]): CrashEvent[] {
    const events: CrashEvent[] = [];
    for (const v of vehicles) {
      for (const o of obstacles) {
        const dx = v.state.position.x - o.position.x;
        const dy = v.state.position.y - o.position.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = v.radius + o.radius;
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;

        if (!o.hard) {
          // Soft hazard (e.g. puddle): grip penalty only, handled by caller via overlap query — no physical push.
          continue;
        }

        const overlap = minDist - dist;
        v.state.position.x += nx * overlap;
        v.state.position.y += ny * overlap;

        const speed = Math.hypot(v.state.velocity.x, v.state.velocity.y);
        const inward = v.state.velocity.x * -nx + v.state.velocity.y * -ny;
        if (inward > 0 && v.state.crashCooldown <= 0) {
          const bounce = inward * 0.9;
          applyCrashImpulse(v.state, { x: nx * bounce, y: ny * bounce }, Math.min(0.12, speed / 2600));
          events.push({ vehicleId: v.id, otherId: 'obstacle', severity: Math.min(1, speed / 700), position: { x: o.position.x, y: o.position.y } });
        }
      }
    }
    return events;
  }
}
