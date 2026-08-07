import Phaser from 'phaser';
import { COLORS, DEPTHS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { FONT } from './Theme';
import { ProgressBar } from './ProgressBar';
import { drawPanel } from './Panel';
import type { TrackGeometry } from '../tracks/TrackGeometry';
import type { RaceVehicle } from '../engine/RaceVehicle';

export class RaceHUD {
  private speedText: Phaser.GameObjects.Text;
  private positionText: Phaser.GameObjects.Text;
  private lapText: Phaser.GameObjects.Text;
  private modeInfoText: Phaser.GameObjects.Text;
  private nitroBar: ProgressBar;
  private driftScoreText: Phaser.GameObjects.Text;
  private countdownText: Phaser.GameObjects.Text;
  private minimapGfx: Phaser.GameObjects.Graphics;
  private minimapDots: Phaser.GameObjects.Arc[] = [];
  private minimapCenter = { x: GAME_WIDTH - 120, y: 130 };
  private minimapRadius = 90;
  private container: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setDepth(DEPTHS.hud).setScrollFactor(0);

    drawPanel(scene, 20, GAME_HEIGHT - 110, 230, 90, { alpha: 0.55 }).setScrollFactor(0).setDepth(DEPTHS.hud);
    this.speedText = scene.add.text(35, GAME_HEIGHT - 100, '0', { ...FONT.h1, fontSize: '42px' }).setScrollFactor(0).setDepth(DEPTHS.hud);
    scene.add.text(35, GAME_HEIGHT - 40, 'KM/H', FONT.small).setScrollFactor(0).setDepth(DEPTHS.hud);

    this.nitroBar = new ProgressBar(scene, 130, GAME_HEIGHT - 130, 100, 12, 0xff5f9d);
    this.nitroBar.setScrollFactor(0).setDepth(DEPTHS.hud);
    scene.add.text(130, GAME_HEIGHT - 148, 'NITRO', { ...FONT.small, fontSize: '12px' }).setScrollFactor(0).setDepth(DEPTHS.hud);

    this.positionText = scene.add.text(GAME_WIDTH / 2, 24, '1 / 1', { ...FONT.h2, fontSize: '30px' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTHS.hud);
    this.lapText = scene.add.text(GAME_WIDTH / 2, 60, 'LAP 1 / 3', FONT.small).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTHS.hud);
    this.modeInfoText = scene.add.text(GAME_WIDTH / 2, 84, '', { ...FONT.small, color: '#ffc371' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTHS.hud);

    this.driftScoreText = scene.add.text(GAME_WIDTH / 2, 110, '', { ...FONT.h3, color: '#7fdcff' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTHS.hud).setVisible(false);

    this.countdownText = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', { ...FONT.h1, fontSize: '96px' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTHS.overlay);

    this.minimapGfx = scene.add.graphics().setScrollFactor(0).setDepth(DEPTHS.hud);
  }

  setSpeed(kmh: number): void {
    this.speedText.setText(`${Math.max(0, kmh)}`);
  }

  setPosition(pos: number, total: number): void {
    this.positionText.setText(`${ordinal(pos)} / ${total}`);
  }

  setLap(lap: number, totalLaps: number): void {
    this.lapText.setText(`LAP ${Math.min(lap, totalLaps)} / ${totalLaps}`);
  }

  setModeInfo(text: string): void {
    this.modeInfoText.setText(text);
  }

  setNitro(fraction: number): void {
    this.nitroBar.setValue(fraction);
  }

  setDriftScore(score: number | null): void {
    if (score === null) {
      this.driftScoreText.setVisible(false);
      return;
    }
    this.driftScoreText.setVisible(true);
    this.driftScoreText.setText(`DRIFT +${Math.round(score)}`);
  }

  showCountdown(text: string): void {
    this.countdownText.setText(text).setAlpha(1).setScale(1.4);
    this.scene.tweens.add({ targets: this.countdownText, scale: 1, duration: 260, ease: 'Back.Out' });
  }

  hideCountdown(): void {
    this.scene.tweens.add({ targets: this.countdownText, alpha: 0, duration: 300 });
  }

  buildMinimap(geo: TrackGeometry): void {
    this.minimapGfx.clear();
    this.minimapGfx.fillStyle(0x000000, 0.35);
    this.minimapGfx.fillCircle(this.minimapCenter.x, this.minimapCenter.y, this.minimapRadius + 10);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of geo.densePoints) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    const scale = (this.minimapRadius * 1.7) / Math.max(maxX - minX, maxY - minY, 1);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    this.minimapGfx.lineStyle(2, 0xffffff, 0.65);
    this.minimapGfx.beginPath();
    geo.densePoints.forEach((p, i) => {
      const x = this.minimapCenter.x + (p.x - cx) * scale;
      const y = this.minimapCenter.y + (p.y - cy) * scale;
      if (i === 0) this.minimapGfx.moveTo(x, y);
      else this.minimapGfx.lineTo(x, y);
    });
    this.minimapGfx.closePath();
    this.minimapGfx.strokePath();

    this.minimapScale = scale;
    this.minimapWorldCenter = { x: cx, y: cy };
  }

  private minimapScale = 1;
  private minimapWorldCenter = { x: 0, y: 0 };

  updateMinimapDots(vehicles: RaceVehicle[]): void {
    this.minimapDots.forEach((d) => d.destroy());
    this.minimapDots = [];
    for (const v of vehicles) {
      const x = this.minimapCenter.x + (v.state.position.x - this.minimapWorldCenter.x) * this.minimapScale;
      const y = this.minimapCenter.y + (v.state.position.y - this.minimapWorldCenter.y) * this.minimapScale;
      const dot = this.scene.add.circle(x, y, v.isPlayer ? 5 : 3.5, v.isPlayer ? COLORS.accentPrimary : v.isPolice ? COLORS.danger : COLORS.accentGold);
      dot.setScrollFactor(0).setDepth(DEPTHS.hud + 1);
      this.minimapDots.push(dot);
    }
  }

  destroy(): void {
    this.container.destroy();
    this.minimapDots.forEach((d) => d.destroy());
  }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
