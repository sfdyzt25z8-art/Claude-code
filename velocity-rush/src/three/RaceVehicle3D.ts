import type { RaceVehicleCore } from '../engine/RaceVehicle';
import type { CarMesh3D } from './CarMesh3D';

/** The 3D-view sibling of `RaceVehicle` — same physics/lap-tracking fields, a Three.js mesh instead of a Phaser visual. */
export interface RaceVehicle3D extends RaceVehicleCore {
  mesh: CarMesh3D;
}
