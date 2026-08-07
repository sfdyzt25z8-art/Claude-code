import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { TEX } from '../assets/ProceduralTextures';
import { saveManager } from '../save/SaveManager';
import { audioManager } from '../audio/AudioManager';
import { liveOpsManager } from '../economy/DailyRewards';
import { xpForLevel } from '../utils/Constants';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.MainMenu);
  }

  create(): void {
    if (!this.scene.isActive(SceneKeys.UIOverlay)) this.scene.launch(SceneKeys.UIOverlay);
    audioManager.playMusic('menu');
    audioManager.setAmbience('clear');

    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    this.buildBackground();
    this.buildHeader();
    this.buildPlayButtons();
    this.buildSideButtons();
    this.buildDailyRewardBanner();
  }

  private buildBackground(): void {
    const grad = this.add.graphics();
    grad.fillGradientStyle(0x0a0e27, 0x0a0e27, 0x1a2456, 0x1a2456, 1);
    grad.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Slow-scrolling road stripe motif for a sense of motion on the menu.
    const roadY = GAME_HEIGHT - 160;
    const road = this.add.graphics();
    road.fillStyle(0x14162a, 1);
    road.fillRect(0, roadY, GAME_WIDTH, 160);
    this.stripeTileX = 0;
    this.stripes = this.add.graphics();
    this.drawStripes(roadY);
    this.tweens.addCounter({
      from: 0,
      to: 120,
      duration: 1400,
      repeat: -1,
      onUpdate: (t) => {
        this.stripeTileX = t.getValue() ?? 0;
        this.drawStripes(roadY);
      },
    });

    for (let i = 0; i < 40; i++) {
      const star = this.add.image(Math.random() * GAME_WIDTH, Math.random() * roadY, TEX.star);
      star.setScale(0.25 + Math.random() * 0.5).setAlpha(0.15 + Math.random() * 0.35);
    }
  }

  private stripeTileX = 0;
  private stripes!: Phaser.GameObjects.Graphics;

  private drawStripes(roadY: number): void {
    this.stripes.clear();
    this.stripes.fillStyle(0xffc371, 0.6);
    for (let x = -120 + this.stripeTileX; x < GAME_WIDTH + 120; x += 120) {
      this.stripes.fillRect(x, roadY + 74, 60, 10);
    }
  }

  private buildHeader(): void {
    this.add.text(GAME_WIDTH / 2, 90, 'VELOCITY RUSH', { ...FONT.h1, fontSize: '58px' }).setOrigin(0.5).setShadow(0, 4, '#000000', 8, true, true);
    this.add.text(GAME_WIDTH / 2, 142, 'Arcade Racing — Career · Drift · Nitro · Nights', FONT.small).setOrigin(0.5);

    const state = saveManager.getState();
    const panel = drawPanel(this, GAME_WIDTH / 2 - 220, 170, 440, 54, { alpha: 0.7 });
    this.add.text(GAME_WIDTH / 2 - 200, 197, `Lv ${state.profile.level}`, { ...FONT.body, color: '#7fdcff' }).setOrigin(0, 0.5);
    const xpBar = new ProgressBar(this, GAME_WIDTH / 2 - 140, 190, 200, 14, COLORS.accentPrimary);
    xpBar.setValue(state.profile.xp / xpForLevel(state.profile.level));
    this.add.image(GAME_WIDTH / 2 + 90, 197, TEX.coin);
    this.add.text(GAME_WIDTH / 2 + 110, 197, state.profile.coins.toLocaleString(), FONT.body).setOrigin(0, 0.5);
    void panel;
  }

  private buildPlayButtons(): void {
    const cx = GAME_WIDTH / 2;
    const startY = 280;
    const gap = 68;
    const goTo = (key: string) => {
      audioManager.uiConfirm();
      this.scene.start(key);
    };
    new Button(this, cx, startY, '🏁 Career', () => goTo(SceneKeys.Career), { width: 320, height: 58 });
    new Button(this, cx, startY + gap, '⚡ Quick Race & Modes', () => goTo(SceneKeys.ModeSelect), { width: 320, height: 58, variant: 'secondary' });
    new Button(this, cx, startY + gap * 2, '🌐 Multiplayer', () => goTo(SceneKeys.Multiplayer), { width: 320, height: 58, variant: 'secondary' });
    new Button(this, cx, startY + gap * 3, '🚗 Garage', () => goTo(SceneKeys.Garage), { width: 320, height: 58, variant: 'secondary' });
  }

  private buildSideButtons(): void {
    const items: [string, string][] = [
      ['🛒 Shop', SceneKeys.Shop],
      ['🏆 Leaderboards', SceneKeys.Leaderboard],
      ['🧑 Profile', SceneKeys.Profile],
      ['🎖 Achievements', SceneKeys.Achievements],
      ['⚙ Settings', SceneKeys.Settings],
      ['ℹ Credits', SceneKeys.Credits],
    ];
    const startX = GAME_WIDTH - 150;
    items.forEach(([label, key], i) => {
      new Button(this, startX, 280 + i * 62, label, () => {
        audioManager.uiConfirm();
        this.scene.start(key);
      }, { width: 240, height: 50, variant: 'ghost' });
    });
  }

  private buildDailyRewardBanner(): void {
    const status = liveOpsManager.getDailyLoginStatus();
    if (!status.canClaim) return;
    const panel = drawPanel(this, GAME_WIDTH / 2 - 230, GAME_HEIGHT - 90, 460, 66, { stroke: COLORS.accentGold, strokeAlpha: 0.8 });
    void panel;
    this.add.text(GAME_WIDTH / 2 - 205, GAME_HEIGHT - 70, `Day ${status.streak + 1} login reward: ${status.nextRewardCoins} coins`, FONT.body);
    new Button(this, GAME_WIDTH / 2 + 155, GAME_HEIGHT - 57, 'Claim', () => {
      const result = liveOpsManager.claimDailyLogin();
      if (result.success) {
        audioManager.coin();
        this.scene.restart();
      }
    }, { width: 120, height: 44, variant: 'primary' });
  }
}
