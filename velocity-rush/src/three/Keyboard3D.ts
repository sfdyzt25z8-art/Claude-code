import type { VehicleInput } from '../physics/VehiclePhysics';

/**
 * Keyboard/gamepad input for the 3D driving view. Mirrors `InputManager`'s
 * WASD/Space/Shift/R mapping, but listens at the `window` level instead of
 * through Phaser's input plugin — the 3D view runs outside Phaser's canvas
 * and scene/input system entirely.
 */
export class Keyboard3D {
  private keys = new Set<string>();
  private resetWasDown = false;
  private cameraToggleWasDown = false;
  private onKeyDown = (e: KeyboardEvent) => this.keys.add(e.code);
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  getInput(): VehicleInput {
    let throttle = 0;
    let steer = 0;
    let handbrake = false;
    let nitro = false;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) throttle += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) throttle -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) steer -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) steer += 1;
    handbrake = this.keys.has('Space');
    nitro = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    const pad = navigator.getGamepads?.()[0];
    if (pad) {
      const rt = pad.buttons[7]?.value ?? 0;
      const lt = pad.buttons[6]?.value ?? 0;
      throttle += rt - lt;
      const stickX = pad.axes[0] ?? 0;
      if (Math.abs(stickX) > 0.12) steer += stickX;
      handbrake = handbrake || (pad.buttons[0]?.pressed ?? false);
      nitro = nitro || (pad.buttons[1]?.pressed ?? false) || (pad.buttons[5]?.pressed ?? false);
    }

    return {
      throttle: Math.max(-1, Math.min(1, throttle)),
      steer: Math.max(-1, Math.min(1, steer)),
      handbrake,
      nitro,
    };
  }

  /** Edge-triggered: true only on the frame the reset key/button is first pressed. */
  consumeResetPressed(): boolean {
    const pad = navigator.getGamepads?.()[0];
    const padDown = pad?.buttons[3]?.pressed ?? false;
    const isDown = this.keys.has('KeyR') || padDown;
    const justPressed = isDown && !this.resetWasDown;
    this.resetWasDown = isDown;
    return justPressed;
  }

  /** Edge-triggered: true only on the frame the camera-toggle key is first pressed. */
  consumeCameraTogglePressed(): boolean {
    const pad = navigator.getGamepads?.()[0];
    const padDown = pad?.buttons[2]?.pressed ?? false;
    const isDown = this.keys.has('KeyC') || padDown;
    const justPressed = isDown && !this.cameraToggleWasDown;
    this.cameraToggleWasDown = isDown;
    return justPressed;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.keys.clear();
  }
}
