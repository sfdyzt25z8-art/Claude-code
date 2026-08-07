import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { drawPanel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { ScrollList } from '../ui/ScrollList';
import { addSceneChrome } from '../ui/SceneChrome';
import { ACHIEVEMENT_DATA } from '../economy/AchievementData';
import { achievementManager } from '../economy/AchievementManager';
import { saveManager } from '../save/SaveManager';

const ROW_HEIGHT = 84;

export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Achievements);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    achievementManager.checkAll();
    addSceneChrome(this, 'Achievements', () => this.scene.start(SceneKeys.MainMenu));

    const state = saveManager.getState();
    const unlockedCount = state.achievements.unlockedIds.length;
    this.add.text(GAME_WIDTH / 2, 96, `${unlockedCount} / ${ACHIEVEMENT_DATA.length} unlocked`, FONT.small).setOrigin(0.5);

    const list = new ScrollList(this, 40, 120, GAME_WIDTH - 80, GAME_HEIGHT - 160);
    ACHIEVEMENT_DATA.forEach((def, i) => {
      const y = i * (ROW_HEIGHT + 10);
      const unlocked = state.achievements.unlockedIds.includes(def.id);
      const panel = drawPanel(this, 0, y, GAME_WIDTH - 120, ROW_HEIGHT, { alpha: unlocked ? 0.65 : 0.35, stroke: unlocked ? COLORS.accentGold : undefined, strokeAlpha: 0.6 });
      list.content.add(panel);
      list.content.add(this.add.text(24, y + 14, unlocked ? `🏆 ${def.title}` : def.title, { ...FONT.h3, color: unlocked ? '#ffc371' : '#e9f3ff' }));
      list.content.add(this.add.text(24, y + 46, def.description, FONT.small));
      const bar = new ProgressBar(this, GAME_WIDTH - 480, y + 30, 320, 14, unlocked ? COLORS.success : COLORS.accentPrimary);
      bar.setValue(def.progress(state));
      list.content.add(bar);
      list.content.add(this.add.text(GAME_WIDTH - 480, y + 50, `+${def.rewardCoins} coins`, FONT.small));
    });
    list.setContentHeight(ACHIEVEMENT_DATA.length * (ROW_HEIGHT + 10));
  }
}
