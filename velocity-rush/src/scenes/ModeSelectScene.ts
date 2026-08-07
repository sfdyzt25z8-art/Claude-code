import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { drawPanel } from '../ui/Panel';
import { addSceneChrome } from '../ui/SceneChrome';
import { RACE_MODE_DESCRIPTIONS, RACE_MODE_LABEL, type RaceMode } from '../engine/RaceTypes';
import { audioManager } from '../audio/AudioManager';

const MODES: RaceMode[] = ['quickRace', 'timeTrial', 'drift', 'checkpoint', 'endless', 'elimination', 'tournament', 'policeChase'];
const ICONS: Partial<Record<RaceMode, string>> = {
  quickRace: '🏁', timeTrial: '⏱', drift: '🌀', checkpoint: '🚩',
  endless: '🛣', elimination: '💥', tournament: '🏆', policeChase: '🚓',
};

export class ModeSelectScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.ModeSelect);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    addSceneChrome(this, 'Select Mode', () => this.scene.start(SceneKeys.MainMenu));

    const cols = 4;
    const cardW = 270;
    const cardH = 180;
    const gapX = 24;
    const gapY = 24;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (GAME_WIDTH - gridW) / 2;
    const startY = 130;

    MODES.forEach((mode, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.buildCard(mode, x, y, cardW, cardH);
    });
  }

  private buildCard(mode: RaceMode, x: number, y: number, w: number, h: number): void {
    const panel = drawPanel(this, x, y, w, h, { alpha: 0.7, stroke: COLORS.accentPrimary, strokeAlpha: 0.15 });
    panel.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    panel.on('pointerover', () => panel.setAlpha(1));
    panel.on('pointerout', () => panel.setAlpha(0.9));
    panel.on('pointerup', () => {
      audioManager.uiConfirm();
      this.scene.start(SceneKeys.RaceSetup, { preset: { mode } });
    });

    this.add.text(x + w / 2, y + 40, ICONS[mode] ?? '🏎', { fontSize: '40px' }).setOrigin(0.5);
    this.add.text(x + w / 2, y + 90, RACE_MODE_LABEL[mode], FONT.h3).setOrigin(0.5);
    this.add
      .text(x + w / 2, y + 130, RACE_MODE_DESCRIPTIONS[mode], { ...FONT.small, wordWrap: { width: w - 30 }, align: 'center' })
      .setOrigin(0.5, 0);
  }
}
