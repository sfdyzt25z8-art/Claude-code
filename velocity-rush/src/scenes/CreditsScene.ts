import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { addSceneChrome } from '../ui/SceneChrome';

const CREDITS: [string, string][] = [
  ['Game Design & Engineering', 'Velocity Rush Team'],
  ['Engine', 'Phaser 3 + TypeScript + Vite'],
  ['Graphics', 'Procedurally generated at runtime — no external art assets'],
  ['Audio', 'Fully synthesised in-browser via the Web Audio API — no audio files'],
  ['Cars & Tracks', '20 original cars across 7 classes, 15 original track themes'],
  ['Special Thanks', 'Everyone who loves arcade racing games'],
];

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Credits);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    addSceneChrome(this, 'Credits', () => this.scene.start(SceneKeys.MainMenu));

    let y = 160;
    CREDITS.forEach(([role, name]) => {
      this.add.text(GAME_WIDTH / 2, y, role, { ...FONT.small, color: '#ffc371' }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, y + 26, name, FONT.h3).setOrigin(0.5);
      y += 90;
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Thanks for playing Velocity Rush!', FONT.body).setOrigin(0.5);
  }
}
