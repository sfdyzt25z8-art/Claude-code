export const SceneKeys = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  MainMenu: 'MainMenuScene',
  Garage: 'GarageScene',
  Shop: 'ShopScene',
  Upgrade: 'UpgradeScene',
  Customization: 'CustomizationScene',
  Career: 'CareerScene',
  ModeSelect: 'ModeSelectScene',
  RaceSetup: 'RaceSetupScene',
  Race: 'RaceScene',
  Race3D: 'Race3DBridgeScene',
  Results: 'ResultsScene',
  Leaderboard: 'LeaderboardScene',
  Profile: 'ProfileScene',
  Achievements: 'AchievementsScene',
  Settings: 'SettingsScene',
  Credits: 'CreditsScene',
  Multiplayer: 'MultiplayerScene',
  UIOverlay: 'UIOverlayScene',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
