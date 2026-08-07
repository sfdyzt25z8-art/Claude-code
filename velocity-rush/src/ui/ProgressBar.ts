import Phaser from 'phaser';
import { COLORS } from '../utils/Constants';

export class ProgressBar extends Phaser.GameObjects.Container {
  private track: Phaser.GameObjects.Graphics;
  private fill: Phaser.GameObjects.Graphics;
  private barWidth: number;
  private barHeight: number;
  private fillColor: number;
  private value = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, fillColor: number = COLORS.accentPrimary) {
    super(scene, x, y);
    this.barWidth = width;
    this.barHeight = height;
    this.fillColor = fillColor;
    this.track = scene.add.graphics();
    this.fill = scene.add.graphics();
    this.track.fillStyle(0x000000, 0.35);
    this.track.fillRoundedRect(0, 0, width, height, height / 2);
    this.add([this.track, this.fill]);
    this.setValue(0);
    scene.add.existing(this);
  }

  setValue(fraction: number, color?: number): void {
    this.value = Phaser.Math.Clamp(fraction, 0, 1);
    if (color !== undefined) this.fillColor = color;
    this.fill.clear();
    if (this.value > 0) {
      this.fill.fillStyle(this.fillColor, 1);
      this.fill.fillRoundedRect(0, 0, Math.max(this.barHeight, this.barWidth * this.value), this.barHeight, this.barHeight / 2);
    }
  }

  getValue(): number {
    return this.value;
  }
}
