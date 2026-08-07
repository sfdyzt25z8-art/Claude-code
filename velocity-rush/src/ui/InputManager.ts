import Phaser from 'phaser';
import type { VehicleInput } from '../physics/VehiclePhysics';
import { TouchControls } from './TouchControls';
import { settingsManager } from '../save/SettingsManager';

/**
 * Unifies keyboard (WASD + Space/Shift), touch (on-screen wheel/pedals), and
 * gamepad input into a single VehicleInput sampled once per frame. Which
 * sources are active is driven by Settings > Controls (auto-detects touch
 * devices by default).
 */
export class InputManager {
  private cursors: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key; space: Phaser.Input.Keyboard.Key; shift: Phaser.Input.Keyboard.Key; r: Phaser.Input.Keyboard.Key } | null = null;
  private touch: TouchControls | null = null;
  private resetWasDown = false;

  constructor(private scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.cursors = {
        w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        shift: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
        r: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      };
    }

    const scheme = settingsManager.get().controlScheme;
    const hasTouch = scene.sys.game.device.input.touch;
    const showTouch = scheme === 'touch' || (scheme === 'auto' && hasTouch);
    if (showTouch) this.touch = new TouchControls(scene);
  }

  getInput(): VehicleInput {
    let throttle = 0;
    let steer = 0;
    let handbrake = false;
    let nitro = false;

    if (this.cursors) {
      if (this.cursors.w.isDown) throttle += 1;
      if (this.cursors.s.isDown) throttle -= 1;
      if (this.cursors.a.isDown) steer -= 1;
      if (this.cursors.d.isDown) steer += 1;
      handbrake = handbrake || this.cursors.space.isDown;
      nitro = nitro || this.cursors.shift.isDown;
    }

    const pad = this.scene.input.gamepad?.getPad(0);
    if (pad) {
      const rt = pad.buttons[7]?.value ?? 0;
      const lt = pad.buttons[6]?.value ?? 0;
      throttle += rt - lt;
      const stickX = pad.axes[0]?.getValue() ?? 0;
      if (Math.abs(stickX) > 0.12) steer += stickX;
      handbrake = handbrake || (pad.buttons[0]?.pressed ?? false);
      nitro = nitro || (pad.buttons[1]?.pressed ?? false) || (pad.buttons[5]?.pressed ?? false);
    }

    if (this.touch) {
      throttle += this.touch.state.throttle;
      steer += this.touch.state.steer;
      handbrake = handbrake || this.touch.state.handbrake;
      nitro = nitro || this.touch.state.nitro;
    }

    return {
      throttle: Phaser.Math.Clamp(throttle, -1, 1),
      steer: Phaser.Math.Clamp(steer, -1, 1),
      handbrake,
      nitro,
    };
  }

  /** Edge-triggered: true only on the frame the reset key/button is first pressed. */
  consumeResetPressed(): boolean {
    const down = this.cursors?.r.isDown ?? false;
    const pad = this.scene.input.gamepad?.getPad(0);
    const padDown = pad?.buttons[3]?.pressed ?? false;
    const isDown = down || padDown;
    const justPressed = isDown && !this.resetWasDown;
    this.resetWasDown = isDown;
    return justPressed;
  }

  destroy(): void {
    this.touch?.destroy();
  }
}
