import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../utils/Constants';
import { FONT } from './Theme';
import { Button } from './Button';
import { TEX } from '../assets/ProceduralTextures';
import { saveManager } from '../save/SaveManager';

export interface SceneChromeHandle {
  container: Phaser.GameObjects.Container;
  refreshCurrency: () => void;
}

/** Standard top bar used by every menu scene: back button, title, coins/level. */
export function addSceneChrome(scene: Phaser.Scene, title: string, onBack?: () => void): SceneChromeHandle {
  const container = scene.add.container(0, 0);
  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.bgPanel, 0.92);
  bg.fillRect(0, 0, GAME_WIDTH, 76);
  bg.lineStyle(1, 0xffffff, 0.06);
  bg.lineBetween(0, 76, GAME_WIDTH, 76);
  container.add(bg);

  if (onBack) {
    const back = new Button(scene, 60, 38, '← Back', onBack, { width: 110, height: 46, variant: 'secondary' });
    container.add(back);
  }

  const titleText = scene.add.text(GAME_WIDTH / 2, 38, title, FONT.h3).setOrigin(0.5);
  container.add(titleText);

  const coinIcon = scene.add.image(GAME_WIDTH - 210, 38, TEX.coin).setScale(1.1);
  const coinText = scene.add.text(GAME_WIDTH - 185, 38, '0', FONT.body).setOrigin(0, 0.5);
  const levelText = scene.add.text(GAME_WIDTH - 80, 38, 'Lv 1', { ...FONT.body, color: '#7fdcff' }).setOrigin(0.5);
  container.add([coinIcon, coinText, levelText]);

  const refreshCurrency = () => {
    const state = saveManager.getState();
    coinText.setText(state.profile.coins.toLocaleString());
    levelText.setText(`Lv ${state.profile.level}`);
  };
  refreshCurrency();

  return { container, refreshCurrency };
}
