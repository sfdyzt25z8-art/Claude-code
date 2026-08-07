import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, xpForLevel } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { drawPanel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { addSceneChrome } from '../ui/SceneChrome';
import { saveManager } from '../save/SaveManager';
import { liveOpsManager } from '../economy/DailyRewards';
import { Button } from '../ui/Button';
import { globalBus } from '../utils/EventBus';
import { audioManager } from '../audio/AudioManager';

export class ProfileScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Profile);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    addSceneChrome(this, 'Profile', () => this.scene.start(SceneKeys.MainMenu));

    const state = saveManager.getState();

    drawPanel(this, 60, 110, GAME_WIDTH - 120, 140, { alpha: 0.6 });
    this.add.text(90, 130, state.profile.name, FONT.h1);
    this.add.text(90, 185, `Level ${state.profile.level}`, { ...FONT.body, color: '#7fdcff' });
    const xpBar = new ProgressBar(this, 220, 195, 300, 16, COLORS.accentPrimary);
    xpBar.setValue(state.profile.xp / xpForLevel(state.profile.level));
    this.add.text(220, 212, `${state.profile.xp} / ${xpForLevel(state.profile.level)} XP`, FONT.small);
    this.add.text(GAME_WIDTH - 300, 140, `${state.profile.coins.toLocaleString()} coins`, FONT.h3);
    this.add.text(GAME_WIDTH - 300, 175, `${state.profile.trophies} trophies`, FONT.h3);

    const stats: [string, string][] = [
      ['Wins', `${state.statistics.wins}`],
      ['Losses', `${state.statistics.losses}`],
      ['Total Races', `${state.statistics.totalRaces}`],
      ['Clean Races', `${state.statistics.cleanRaces}`],
      ['Drift Distance', `${state.statistics.driftDistanceMeters.toLocaleString()} m`],
      ['Mileage', `${state.statistics.mileageMeters.toLocaleString()} m`],
      ['Stunt Score', `${state.statistics.stuntScore.toLocaleString()}`],
      ['Coins Earned (lifetime)', `${state.statistics.totalCoinsEarned.toLocaleString()}`],
      ['XP Earned (lifetime)', `${state.statistics.totalXpEarned.toLocaleString()}`],
      ['Cars Owned', `${state.garage.ownedCarIds.length} / 20`],
      ['Tracks Unlocked', `${state.unlockedTrackIds.length} / 15`],
      ['Achievements', `${state.achievements.unlockedIds.length} / 19`],
    ];

    const panel = drawPanel(this, 60, 270, GAME_WIDTH - 120, 300, { alpha: 0.55 });
    void panel;
    const cols = 2;
    const colWidth = (GAME_WIDTH - 160) / cols;
    stats.forEach(([label, value], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 100 + col * colWidth;
      const y = 300 + row * 42;
      this.add.text(x, y, label, FONT.small);
      this.add.text(x + colWidth - 40, y, value, FONT.body).setOrigin(1, 0);
    });

    this.buildDailyMissions();
  }

  private buildDailyMissions(): void {
    liveOpsManager.ensureFreshMissions();
    const missions = liveOpsManager.getTodayMissions();
    const panelY = 590;
    drawPanel(this, 60, panelY, GAME_WIDTH - 120, 100, { alpha: 0.6, stroke: COLORS.accentGold, strokeAlpha: 0.4 });
    this.add.text(90, panelY + 12, 'Daily Missions', FONT.h3);

    missions.forEach((m, i) => {
      const x = 100 + i * 380;
      const y = panelY + 46;
      const label = `${m.template.label} (${m.state.progress}/${m.state.target})`;
      this.add.text(x, y, label, FONT.small);
      const canClaim = m.state.completed && !m.state.claimed;
      new Button(this, x + 300, y + 5, m.state.claimed ? 'Done' : canClaim ? 'Claim' : `+${m.template.rewardCoins}c`, () => {
        if (!canClaim) return;
        const result = liveOpsManager.claimMission(m.template.id);
        if (result.success) {
          audioManager.coin();
          globalBus.emit('toast', { message: `Claimed +${result.coins} coins, +${result.xp} XP`, kind: 'success' });
          this.scene.restart();
        }
      }, { width: 90, height: 34, disabled: !canClaim, variant: canClaim ? 'primary' : 'ghost' });
    });
  }
}
