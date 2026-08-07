import Phaser from 'phaser';
import { COLORS, DEPTHS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { FONT } from './Theme';

export interface TouchState {
  throttle: number;
  steer: number;
  handbrake: boolean;
  nitro: boolean;
}

/**
 * On-screen touch controls for mobile: a drag-steering wheel (bottom-left),
 * gas + brake pedals and a handbrake button (bottom-right), and a nitro
 * button. Pure input capture — RaceScene polls `state` each frame.
 */
export class TouchControls {
  readonly state: TouchState = { throttle: 0, steer: 0, handbrake: false, nitro: false };
  private container: Phaser.GameObjects.Container;
  private wheelKnob: Phaser.GameObjects.Arc;
  private wheelBase: Phaser.GameObjects.Arc;
  private wheelPointerId: number | null = null;
  private wheelCenter: { x: number; y: number };
  private wheelRadius = 70;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setDepth(DEPTHS.touchControls).setScrollFactor(0);
    // See RaceHUD's offMainCamera() for why: scrollFactor(0) input hit-testing breaks once
    // the main camera has scrolled, so these are rendered by RaceScene's dedicated UI camera.
    scene.cameras.main.ignore(this.container);
    this.wheelCenter = { x: 140, y: GAME_HEIGHT - 150 };

    this.wheelBase = scene.add.circle(this.wheelCenter.x, this.wheelCenter.y, this.wheelRadius, 0x000000, 0.28).setStrokeStyle(3, 0xffffff, 0.35);
    this.wheelKnob = scene.add.circle(this.wheelCenter.x, this.wheelCenter.y, 32, 0xffffff, 0.5);
    this.container.add([this.wheelBase, this.wheelKnob]);

    const wheelZone = scene.add.zone(this.wheelCenter.x, this.wheelCenter.y, this.wheelRadius * 2.6, this.wheelRadius * 2.6).setInteractive();
    this.container.add(wheelZone);
    wheelZone.on('pointerdown', (p: Phaser.Input.Pointer) => this.startWheel(p));
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => this.moveWheel(p));
    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => this.endWheel(p));
    scene.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.endWheel(p));

    this.buildButton(GAME_WIDTH - 120, GAME_HEIGHT - 90, 64, 'GAS', COLORS.success, 'throttle', 1);
    this.buildButton(GAME_WIDTH - 240, GAME_HEIGHT - 60, 54, 'BRAKE', COLORS.danger, 'throttle', -1);
    this.buildButton(GAME_WIDTH - 240, GAME_HEIGHT - 170, 50, 'E-BRAKE', COLORS.accentGold, 'handbrake', 1);
    this.buildButton(GAME_WIDTH - 120, GAME_HEIGHT - 210, 58, 'NITRO', 0xff5f9d, 'nitro', 1);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private buildButton(x: number, y: number, radius: number, label: string, color: number, field: 'throttle' | 'handbrake' | 'nitro', onValue: number): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.35).setStrokeStyle(2, 0xffffff, 0.4);
    const text = this.scene.add.text(x, y, label, { ...FONT.small, fontSize: '13px' }).setOrigin(0.5);
    this.container.add([circle, text]);
    const zone = this.scene.add.zone(x, y, radius * 2.2, radius * 2.2).setInteractive();
    this.container.add(zone);

    const setActive = (active: boolean) => {
      circle.setFillStyle(color, active ? 0.75 : 0.35);
      if (field === 'handbrake') this.state.handbrake = active;
      else if (field === 'nitro') this.state.nitro = active;
      else this.state.throttle = active ? onValue : this.state.throttle === onValue ? 0 : this.state.throttle;
    };
    zone.on('pointerdown', () => setActive(true));
    zone.on('pointerup', () => setActive(false));
    zone.on('pointerupoutside', () => setActive(false));
  }

  private startWheel(pointer: Phaser.Input.Pointer): void {
    if (this.wheelPointerId !== null) return;
    this.wheelPointerId = pointer.id;
    this.moveWheel(pointer);
  }

  private moveWheel(pointer: Phaser.Input.Pointer): void {
    if (this.wheelPointerId !== pointer.id) return;
    const dx = Phaser.Math.Clamp(pointer.x - this.wheelCenter.x, -this.wheelRadius, this.wheelRadius);
    const dy = Phaser.Math.Clamp(pointer.y - this.wheelCenter.y, -this.wheelRadius, this.wheelRadius);
    this.wheelKnob.setPosition(this.wheelCenter.x + dx, this.wheelCenter.y + dy);
    this.state.steer = Phaser.Math.Clamp(dx / this.wheelRadius, -1, 1);
  }

  private endWheel(pointer: Phaser.Input.Pointer): void {
    if (this.wheelPointerId !== pointer.id) return;
    this.wheelPointerId = null;
    this.wheelKnob.setPosition(this.wheelCenter.x, this.wheelCenter.y);
    this.state.steer = 0;
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }
}
