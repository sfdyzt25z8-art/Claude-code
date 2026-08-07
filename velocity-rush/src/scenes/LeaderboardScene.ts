import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { drawPanel } from '../ui/Panel';
import { ScrollList } from '../ui/ScrollList';
import { addSceneChrome } from '../ui/SceneChrome';
import { TRACK_DATA } from '../tracks/TrackData';
import { saveManager } from '../save/SaveManager';

const ROW_HEIGHT = 70;

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Leaderboard);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    addSceneChrome(this, 'Leaderboards', () => this.scene.start(SceneKeys.MainMenu));
    this.add.text(GAME_WIDTH / 2, 96, 'Local best times on this device — online leaderboards arrive with full multiplayer.', FONT.small).setOrigin(0.5);

    const list = new ScrollList(this, 40, 120, GAME_WIDTH - 80, GAME_HEIGHT - 160);
    const state = saveManager.getState();
    const unlocked = TRACK_DATA.filter((t) => state.unlockedTrackIds.includes(t.id));

    unlocked.forEach((track, i) => {
      const y = i * (ROW_HEIGHT + 10);
      const panel = drawPanel(this, 0, y, GAME_WIDTH - 120, ROW_HEIGHT, { alpha: 0.5 });
      list.content.add(panel);
      const record = state.lapRecords[track.id];
      list.content.add(this.add.text(24, y + 14, track.name, FONT.h3));
      list.content.add(this.add.text(24, y + 42, track.theme.toUpperCase(), { ...FONT.small, color: '#ffc371' }));
      list.content.add(this.add.text(GAME_WIDTH - 500, y + 20, `Best Lap: ${record?.bestLapTime ? formatTime(record.bestLapTime) : '—'}`, FONT.body));
      list.content.add(this.add.text(GAME_WIDTH - 260, y + 20, `Best Total: ${record?.bestTotalTime ? formatTime(record.bestTotalTime) : '—'}`, FONT.body));
    });
    list.setContentHeight(unlocked.length * (ROW_HEIGHT + 10));
  }
}

function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return `${minutes}:${seconds.padStart(5, '0')}`;
}
