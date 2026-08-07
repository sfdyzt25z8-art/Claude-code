import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { GarageScene } from '../scenes/GarageScene';
import { ShopScene } from '../scenes/ShopScene';
import { UpgradeScene } from '../scenes/UpgradeScene';
import { CustomizationScene } from '../scenes/CustomizationScene';
import { CareerScene } from '../scenes/CareerScene';
import { ModeSelectScene } from '../scenes/ModeSelectScene';
import { RaceSetupScene } from '../scenes/RaceSetupScene';
import { RaceScene } from '../scenes/RaceScene';
import { ResultsScene } from '../scenes/ResultsScene';
import { LeaderboardScene } from '../scenes/LeaderboardScene';
import { ProfileScene } from '../scenes/ProfileScene';
import { AchievementsScene } from '../scenes/AchievementsScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { CreditsScene } from '../scenes/CreditsScene';
import { MultiplayerScene } from '../scenes/MultiplayerScene';
import { UIOverlayScene } from '../scenes/UIOverlayScene';

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: COLORS.bgDark,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    input: {
      activePointers: 3,
      gamepad: true,
    },
    // All audio is our own Web Audio synthesis (see src/audio) — disable
    // Phaser's built-in Sound Manager so it doesn't spin up a second, unused
    // AudioContext at boot.
    audio: {
      noAudio: true,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: 'high-performance',
    },
    fps: {
      target: 60,
      smoothStep: true,
    },
    scene: [
      BootScene,
      PreloadScene,
      MainMenuScene,
      GarageScene,
      ShopScene,
      UpgradeScene,
      CustomizationScene,
      CareerScene,
      ModeSelectScene,
      RaceSetupScene,
      RaceScene,
      ResultsScene,
      LeaderboardScene,
      ProfileScene,
      AchievementsScene,
      SettingsScene,
      CreditsScene,
      MultiplayerScene,
      UIOverlayScene,
    ],
  };
}
