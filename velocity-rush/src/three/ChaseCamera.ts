import * as THREE from 'three';

export type CameraMode = 'chase' | 'cockpit';

/**
 * The race camera: a smoothed 3rd-person chase view (stays behind and above
 * the car, looking slightly ahead, with a small FOV kick under nitro) plus a
 * rigidly-mounted 1st-person cockpit view, toggleable mid-race. Chase-mode
 * position/look-at are exponentially smoothed (frame-rate independent)
 * rather than snapped, so it doesn't feel jittery at variable frame rates;
 * cockpit mode snaps directly to the car each frame since it's meant to feel
 * rigidly attached, like a real onboard camera.
 */
export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera;
  private currentPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private initialized = false;
  private currentFov = 62;
  private mode: CameraMode = 'chase';

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 900);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  getMode(): CameraMode {
    return this.mode;
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  toggleMode(): void {
    this.mode = this.mode === 'chase' ? 'cockpit' : 'chase';
  }

  update(targetPos: { x: number; y: number; z: number }, headingRad: number, speedFrac: number, dt: number, boosting: boolean): void {
    if (this.mode === 'cockpit') {
      this.updateCockpit(targetPos, headingRad, boosting);
    } else {
      this.updateChase(targetPos, headingRad, speedFrac, dt, boosting);
    }
  }

  private updateChase(targetPos: { x: number; y: number; z: number }, headingRad: number, speedFrac: number, dt: number, boosting: boolean): void {
    const forwardX = Math.cos(headingRad);
    const forwardZ = Math.sin(headingRad);
    const backDistance = 8.0 + speedFrac * 2.6;
    const height = 2.6 + speedFrac * 0.4;

    const desiredPos = new THREE.Vector3(
      targetPos.x - forwardX * backDistance,
      targetPos.y + height,
      targetPos.z - forwardZ * backDistance,
    );
    const desiredLookAt = new THREE.Vector3(
      targetPos.x + forwardX * 4,
      targetPos.y + 0.7,
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
    this.applyFov(boosting ? 72 : 62, dt);
  }

  private updateCockpit(targetPos: { x: number; y: number; z: number }, headingRad: number, boosting: boolean): void {
    const forwardX = Math.cos(headingRad);
    const forwardZ = Math.sin(headingRad);
    const eye = new THREE.Vector3(targetPos.x + forwardX * 0.2, targetPos.y + 0.62, targetPos.z + forwardZ * 0.2);
    const lookAt = new THREE.Vector3(targetPos.x + forwardX * 20, targetPos.y + 0.45, targetPos.z + forwardZ * 20);

    this.currentPos.copy(eye);
    this.currentLookAt.copy(lookAt);
    this.initialized = true;

    this.camera.position.copy(eye);
    this.camera.lookAt(lookAt);
    this.applyFov(boosting ? 84 : 76, 1); // wide, immersive FOV; snaps instantly (no dt smoothing needed for a rigid mount)
  }

  private applyFov(targetFov: number, dt: number): void {
    this.currentFov += (targetFov - this.currentFov) * Math.min(1, dt * 4);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
  }

  reset(): void {
    this.initialized = false;
  }
}
