import Phaser from 'phaser';
import { COLORS } from '../utils/Constants';
import { FONT } from './Theme';
import { ProgressBar } from './ProgressBar';

/** Labelled horizontal stat row used in car stat panels (Top Speed, Grip, etc). */
export class StatBar extends Phaser.GameObjects.Container {
  private bar: ProgressBar;
  private valueText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, label: string, value: number, color: number = COLORS.accentPrimary) {
    super(scene, x, y);
    const labelText = scene.add.text(0, 0, label, FONT.small).setOrigin(0, 0.5);
    this.bar = new ProgressBar(scene, 130, -6, width - 170, 12, color);
    this.bar.setValue(value / 100);
    this.valueText = scene.add.text(width, 0, `${Math.round(value)}`, FONT.small).setOrigin(1, 0.5);
    this.add([labelText, this.bar, this.valueText]);
    scene.add.existing(this);
  }

  setValue(value: number): void {
    this.bar.setValue(value / 100);
    this.valueText.setText(`${Math.round(value)}`);
  }
}
