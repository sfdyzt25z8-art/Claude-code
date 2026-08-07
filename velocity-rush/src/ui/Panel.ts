import Phaser from 'phaser';
import { COLORS } from '../utils/Constants';

export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: number; alpha?: number; radius?: number; stroke?: number; strokeAlpha?: number; strokeWidth?: number } = {},
): Phaser.GameObjects.Graphics {
  const gfx = scene.add.graphics({ x, y });
  gfx.fillStyle(opts.fill ?? COLORS.bgPanel, opts.alpha ?? 0.92);
  gfx.fillRoundedRect(0, 0, w, h, opts.radius ?? 16);
  if (opts.stroke !== undefined) {
    gfx.lineStyle(opts.strokeWidth ?? 2, opts.stroke, opts.strokeAlpha ?? 0.6);
    gfx.strokeRoundedRect(0, 0, w, h, opts.radius ?? 16);
  }
  return gfx;
}
