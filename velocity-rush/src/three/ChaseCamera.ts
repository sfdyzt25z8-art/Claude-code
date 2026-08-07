import * as THREE from 'three';

/**
 * Smooth 3rd-person follow camera: stays behind and above the car, looking
 * slightly ahead of it, with a small FOV kick under nitro for a sense of
 * speed. Position/look-at are exponentially smoothed (frame-rate independent)
 * rather than snapped, so it doesn't feel jittery at variable frame rates.
 */
export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera;
  private currentPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private initialized = false;
  private currentFov = 62;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 900);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(targetPos: { x: number; y: number; z: number }, headingRad: number, speedFrac: number, dt: number, boosting: boolean): void {
    const forwardX = Math.cos(headingRad);
    const forwardZ = Math.sin(headingRad);
    const backDistance = 7.2 + speedFrac * 2.2;
    const height = 3.0 + speedFrac * 0.4;

    const desiredPos = new THREE.Vector3(
      targetPos.x - forwardX * backDistance,
      targetPos.y + height,
      targetPos.z - forwardZ * backDistance,
    );
    const desiredLookAt = new THREE.Vector3(
      targetPos.x + forwardX * 4,
      targetPos.y + 0.9,
      targetPos.z + forwardZ * 4,
    );

    if (!this.initialized) {
      this.currentPos.copy(desiredPos);
      this.currentLookAt.copy(desiredLookAt);
      this.initialized = true;
    }

    const posLerp = 1 - Math.pow(0.0015, dt);
    const lookLerp = 1 - Math.pow(0.0004, dt);
    this.currentPos.lerp(desiredPos, THREE.MathUtils.clamp(posLerp, 0, 1));
    this.currentLookAt.lerp(desiredLookAt, THREE.MathUtils.clamp(lookLerp, 0, 1));

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);

    const targetFov = boosting ? 72 : 62;
    this.currentFov += (targetFov - this.currentFov) * Math.min(1, dt * 4);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
  }

  reset(): void {
    this.initialized = false;
  }
}
