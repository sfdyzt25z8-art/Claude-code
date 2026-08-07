import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { ScrollList } from '../ui/ScrollList';
import { addSceneChrome } from '../ui/SceneChrome';
import { CAREER_STAGES, isStageUnlocked } from '../engine/CareerData';
import { getTrackById } from '../tracks/TrackData';
import { saveManager } from '../save/SaveManager';
import { RACE_MODE_LABEL } from '../engine/RaceTypes';
import { audioManager } from '../audio/AudioManager';
import { globalBus } from '../utils/EventBus';

const ROW_HEIGHT = 92;

export class CareerScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Career);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    addSceneChrome(this, 'Career', () => this.scene.start(SceneKeys.MainMenu));

    const state = saveManager.getState();
    const list = new ScrollList(this, 40, 100, GAME_WIDTH - 80, GAME_HEIGHT - 140);

    let currentChapter = 0;
    let y = 0;
    CAREER_STAGES.forEach((stage) => {
      if (stage.chapter !== currentChapter) {
        currentChapter = stage.chapter;
        const chapterLabel = this.add.text(0, y, `CHAPTER ${currentChapter}`, { ...FONT.small, color: '#ffc371' });
        list.content.add(chapterLabel);
        y += 34;
      }

      const track = getTrackById(stage.trackId);
      const completed = state.careerProgress.completedStageIds.includes(stage.id);
      const unlocked = isStageUnlocked(stage, state.careerProgress.completedStageIds, state.profile.level);

      const panel = drawPanel(this, 0, y, GAME_WIDTH - 120, ROW_HEIGHT - 10, {
        alpha: unlocked ? 0.6 : 0.3,
        stroke: completed ? COLORS.success : undefined,
        strokeAlpha: 0.8,
      });
      list.content.add(panel);

      const status = completed ? '✓ Completed' : unlocked ? 'Available' : '🔒 Locked';
      this.addRowText(list, 24, y + 14, stage.title, FONT.h3);
      this.addRowText(list, 24, y + 46, `${track?.name ?? ''} · ${RACE_MODE_LABEL[stage.mode]} · ${stage.difficulty.toUpperCase()} · Finish P${stage.requiredPosition} or better`, FONT.small);
      this.addRowText(list, 24, y + 66, status, { ...FONT.small, color: completed ? '#38ef7d' : unlocked ? '#7fdcff' : '#8fa0c8' });
      this.addRowText(list, GAME_WIDTH - 500, y + ROW_HEIGHT / 2 - 20, `+${stage.rewardCoins} coins`, FONT.small);
      this.addRowText(list, GAME_WIDTH - 500, y + ROW_HEIGHT / 2, `+${stage.rewardXp} XP`, FONT.small);

      const btn = new Button(this, GAME_WIDTH - 260, y + ROW_HEIGHT / 2 - 5, completed ? 'Replay' : 'Race', () => {
        if (!unlocked) {
          globalBus.emit('toast', { message: 'Complete the previous stage first', kind: 'warning' });
          return;
        }
        audioManager.uiConfirm();
        this.scene.start(SceneKeys.RaceSetup, {
          preset: {
            mode: stage.mode,
            trackId: stage.trackId,
            difficulty: stage.difficulty,
            opponentCount: stage.opponentCount,
            careerStageId: stage.id,
          },
        });
      }, { width: 180, height: 52, disabled: !unlocked, variant: completed ? 'secondary' : 'primary' });
      list.content.add(btn);

      y += ROW_HEIGHT;
    });
    list.setContentHeight(y);
  }

  private addRowText(list: ScrollList, x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle): void {
    list.content.add(this.add.text(x, y, text, style));
  }
}
