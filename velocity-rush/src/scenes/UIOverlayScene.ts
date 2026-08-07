import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { globalBus } from '../utils/EventBus';
import { GAME_WIDTH, COLORS, DEPTHS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { drawPanel } from '../ui/Panel';
import { audioManager } from '../audio/AudioManager';
import { ACHIEVEMENT_DATA } from '../economy/AchievementData';

interface QueuedToast {
  message: string;
  kind: 'info' | 'success' | 'warning' | 'error';
}

/**
 * A single persistent scene layered above every other scene (launched once
 * from MainMenuScene, never stopped) that renders transient notifications:
 * toasts, achievement unlocks, coin/xp popups. Keeps that presentation logic
 * out of every individual menu/race scene.
 */
export class UIOverlayScene extends Phaser.Scene {
  private queue: QueuedToast[] = [];
  private showing = false;

  constructor() {
    super(SceneKeys.UIOverlay);
  }

  create(): void {
    this.cameras.main.setName('overlay');
    globalBus.on('toast', (payload) => this.enqueue(payload.message, payload.kind ?? 'info'));
    globalBus.on('achievement-unlocked', (payload) => {
      const def = ACHIEVEMENT_DATA.find((a) => a.id === payload.id);
      this.showAchievement(payload.title, def?.description ?? '');
    });
  }

  private enqueue(message: string, kind: QueuedToast['kind']): void {
    this.queue.push({ message, kind });
    this.pump();
  }

  private pump(): void {
    if (this.showing || this.queue.length === 0) return;
    this.showing = true;
    const { message, kind } = this.queue.shift()!;
    const color = { info: COLORS.accentPrimary, success: COLORS.success, warning: COLORS.accentGold, danger: COLORS.danger, error: COLORS.danger }[kind] ?? COLORS.accentPrimary;

    const width = Math.min(560, 40 + message.length * 10);
    const panel = drawPanel(this, GAME_WIDTH / 2 - width / 2, 100, width, 56, { stroke: color, strokeAlpha: 0.8 });
    const text = this.add.text(GAME_WIDTH / 2, 128, message, FONT.body).setOrigin(0.5);
    panel.setDepth(DEPTHS.overlay);
    text.setDepth(DEPTHS.overlay);
    panel.setAlpha(0);
    text.setAlpha(0);
    panel.y -= 20;
    text.y -= 20;

    this.tweens.add({
      targets: [panel, text],
      alpha: 1,
      y: '+=20',
      duration: 220,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: [panel, text],
            alpha: 0,
            y: '-=10',
            duration: 220,
            onComplete: () => {
              panel.destroy();
              text.destroy();
              this.showing = false;
              this.pump();
            },
          });
        });
      },
    });
  }

  private showAchievement(title: string, description: string): void {
    audioManager.achievement();
    const width = 420;
    const panel = drawPanel(this, GAME_WIDTH - width - 30, 100, width, 84, { stroke: COLORS.accentGold, strokeAlpha: 0.9, fill: COLORS.bgPanel });
    const heading = this.add.text(GAME_WIDTH - width - 10, 116, '🏆 ACHIEVEMENT UNLOCKED', { ...FONT.small, color: '#ffc371' });
    const titleText = this.add.text(GAME_WIDTH - width - 10, 138, title, FONT.h3);
    const descText = this.add.text(GAME_WIDTH - width - 10, 168, description, FONT.small);
    [panel, heading, titleText, descText].forEach((o) => o.setDepth(DEPTHS.overlay));

    panel.setAlpha(0);
    heading.setAlpha(0);
    titleText.setAlpha(0);
    descText.setAlpha(0);
    const targets = [panel, heading, titleText, descText];
    targets.forEach((t) => (t.x += 40));

    this.tweens.add({
      targets,
      alpha: 1,
      x: '-=40',
      duration: 300,
      ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(3600, () => {
          this.tweens.add({ targets, alpha: 0, x: '+=40', duration: 260, onComplete: () => targets.forEach((t) => t.destroy()) });
        });
      },
    });
  }
}
