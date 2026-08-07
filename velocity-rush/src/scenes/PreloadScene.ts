import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { audioManager } from '../audio/AudioManager';
import { progressionManager } from '../economy/ProgressionManager';
import { liveOpsManager } from '../economy/DailyRewards';
import { achievementManager } from '../economy/AchievementManager';

/**
 * Runs one-time app startup bookkeeping (unlock syncing, daily missions,
 * achievement sweep) and — critically — waits for a user gesture before
 * unlocking the WebAudio context, since browsers block autoplay otherwise.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preload);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);

    progressionManager.syncTrackUnlocks();
    liveOpsManager.ensureFreshMissions();
    achievementManager.checkAll();

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'VELOCITY RUSH', { ...FONT.h1, fontSize: '64px' })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500, ease: 'Sine.Out' });

    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'Tap or press any key to start', FONT.body)
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: { from: 0.3, to: 1 }, duration: 700, yoyo: true, repeat: -1 });

    const proceed = () => {
      audioManager.unlock();
      audioManager.uiConfirm();
      this.scene.start(SceneKeys.MainMenu);
    };

    this.input.once('pointerdown', proceed);
    this.input.keyboard?.once('keydown', proceed);
  }
}
