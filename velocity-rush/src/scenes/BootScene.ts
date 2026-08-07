import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { generateAllTextures } from '../assets/ProceduralTextures';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants';

/** Generates every procedural texture the game uses, then hands off to PreloadScene. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    const label = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Generating assets…', {
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: '20px',
        color: '#7fdcff',
      })
      .setOrigin(0.5);

    // Texture generation is synchronous but cheap; defer one frame so the
    // "Generating assets…" label actually paints first.
    this.time.delayedCall(16, () => {
      generateAllTextures(this);
      label.destroy();
      this.scene.start(SceneKeys.Preload);
    });
  }
}
