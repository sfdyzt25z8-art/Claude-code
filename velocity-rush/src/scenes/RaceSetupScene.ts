import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DIFFICULTY_SETTINGS, type Difficulty } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { addSceneChrome } from '../ui/SceneChrome';
import { buildCarVisual } from '../ui/CarPreview';
import { progressionManager } from '../economy/ProgressionManager';
import { customizationManager } from '../customization/CustomizationManager';
import { saveManager } from '../save/SaveManager';
import { settingsManager } from '../save/SettingsManager';
import { getTrackById } from '../tracks/TrackData';
import { buildClosedSpline } from '../utils/MathUtils';
import type { RaceConfig } from '../engine/RaceTypes';
import { RACE_MODE_LABEL } from '../engine/RaceTypes';
import { generateTournamentTrackIds, TOURNAMENT_ROUNDS } from '../engine/Tournament';
import { audioManager } from '../audio/AudioManager';

interface RaceSetupData {
  preset: Partial<RaceConfig>;
}

const NO_OPPONENT_MODES = new Set(['timeTrial', 'drift', 'checkpoint', 'endless']);
const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'expert'];

export class RaceSetupScene extends Phaser.Scene {
  private preset: Partial<RaceConfig> = {};
  private trackIndex = 0;
  private carIndex = 0;
  private difficulty: Difficulty = 'normal';
  private opponentCount = 5;
  private tracks = progressionManager.getUnlockedTracks();
  private cars = progressionManager.getOwnedCars();
  private body: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(SceneKeys.RaceSetup);
  }

  create(data: RaceSetupData): void {
    this.preset = data.preset ?? {};
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    addSceneChrome(this, `Set Up — ${RACE_MODE_LABEL[this.preset.mode ?? 'quickRace']}`, () =>
      this.scene.start(this.preset.careerStageId ? SceneKeys.Career : SceneKeys.MainMenu),
    );

    this.tracks = progressionManager.getUnlockedTracks();
    this.cars = progressionManager.getOwnedCars();

    if (this.preset.mode === 'tournament') {
      if (!this.preset.tournament) {
        this.preset.tournament = {
          round: 1,
          totalRounds: TOURNAMENT_ROUNDS,
          trackIds: generateTournamentTrackIds(this.tracks.map((t) => t.id), TOURNAMENT_ROUNDS, Date.now()),
          pointsSoFar: 0,
        };
      }
      this.preset.trackId = this.preset.tournament.trackIds[this.preset.tournament.round - 1];
    }

    const state = saveManager.getState();
    this.trackIndex = Math.max(0, this.tracks.findIndex((t) => t.id === (this.preset.trackId ?? state.selectedTrackId)));
    if (this.trackIndex < 0) this.trackIndex = 0;
    this.carIndex = Math.max(0, this.cars.findIndex((c) => c.id === state.garage.selectedCarId));
    this.difficulty = this.preset.difficulty ?? settingsManager.get().defaultDifficulty;
    this.opponentCount = this.preset.opponentCount ?? 5;

    this.render();
  }

  private render(): void {
    this.body.forEach((o) => o.destroy());
    this.body = [];

    this.renderTrackPicker();
    this.renderCarPicker();
    this.renderDifficultyPicker();
    this.renderStartButton();
  }

  private add_(o: Phaser.GameObjects.GameObject): void {
    this.body.push(o);
  }

  private renderTrackPicker(): void {
    const panel = drawPanel(this, 40, 100, 560, 320, { alpha: 0.55 });
    this.add_(panel);
    const locked = !!this.preset.trackId;
    const isEndless = this.preset.mode === 'endless';

    if (isEndless) {
      this.add_(this.add.text(320, 240, 'Endless Highway', FONT.h2).setOrigin(0.5));
      this.add_(this.add.text(320, 280, 'A procedurally-generated highway that never ends.\nSurvive traffic and rising speed for as long as you can.', { ...FONT.small, align: 'center' }).setOrigin(0.5));
      return;
    }

    const track = this.tracks[this.trackIndex];
    if (!track) {
      this.add_(this.add.text(320, 240, 'No unlocked tracks', FONT.body).setOrigin(0.5));
      return;
    }

    if (!locked) {
      this.add_(new Button(this, 70, 260, '◀', () => this.cycleTrack(-1), { width: 50, height: 50, variant: 'ghost' }));
      this.add_(new Button(this, 570, 260, '▶', () => this.cycleTrack(1), { width: 50, height: 50, variant: 'ghost' }));
    }

    this.add_(this.drawTrackShapePreview(track));
    this.add_(this.add.text(320, 130, track.name, FONT.h2).setOrigin(0.5));
    this.add_(this.add.text(320, 268, track.theme.toUpperCase(), { ...FONT.small, color: '#ffc371' }).setOrigin(0.5));
    this.add_(this.add.text(320, 296, track.description, { ...FONT.small, wordWrap: { width: 480 }, align: 'center' }).setOrigin(0.5, 0));
    this.add_(this.add.text(320, 350, `${track.laps} laps · ${track.timeOfDay} · Target lap ${track.targetLapTime}s`, FONT.small).setOrigin(0.5));
    if (this.preset.tournament) {
      this.add_(this.add.text(320, 380, `Tournament — Round ${this.preset.tournament.round} / ${this.preset.tournament.totalRounds}`, { ...FONT.small, color: '#ffc371' }).setOrigin(0.5));
    } else if (locked) {
      this.add_(this.add.text(320, 380, 'Career Track', { ...FONT.small, color: '#7fdcff' }).setOrigin(0.5));
    }
  }

  private drawTrackShapePreview(track: NonNullable<ReturnType<typeof getTrackById>>): Phaser.GameObjects.Graphics {
    const boxX = 90;
    const boxY = 150;
    const boxW = 460;
    const boxH = 100;
    const gfx = this.add.graphics();
    gfx.fillStyle(track.palette.offTrack, 1);
    gfx.fillRoundedRect(boxX, boxY, boxW, boxH, 10);

    const dense = buildClosedSpline(track.controlPoints, 10);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of dense) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    const pad = 14;
    const scale = Math.min((boxW - pad * 2) / Math.max(1, maxX - minX), (boxH - pad * 2) / Math.max(1, maxY - minY));
    const cx = boxX + boxW / 2;
    const cy = boxY + boxH / 2;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    gfx.lineStyle(4, track.palette.surfaceLine, 0.9);
    gfx.beginPath();
    dense.forEach((p, i) => {
      const x = cx + (p.x - midX) * scale;
      const y = cy + (p.y - midY) * scale;
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    });
    gfx.closePath();
    gfx.strokePath();
    return gfx;
  }

  private cycleTrack(dir: number): void {
    if (this.tracks.length === 0) return;
    this.trackIndex = (this.trackIndex + dir + this.tracks.length) % this.tracks.length;
    audioManager.uiClick();
    this.render();
  }

  private renderCarPicker(): void {
    const panel = drawPanel(this, 620, 100, 620, 320, { alpha: 0.55 });
    this.add_(panel);
    const car = this.cars[this.carIndex];
    if (!car) {
      this.add_(this.add.text(930, 260, 'No cars owned', FONT.body).setOrigin(0.5));
      return;
    }

    this.add_(new Button(this, 660, 260, '◀', () => this.cycleCar(-1), { width: 50, height: 50, variant: 'ghost' }));
    this.add_(new Button(this, 1160, 260, '▶', () => this.cycleCar(1), { width: 50, height: 50, variant: 'ghost' }));

    const visual = buildCarVisual(this, car, customizationManager.getState(car.id));
    visual.container.setPosition(930, 220).setScale(2.2);
    this.add_(visual.container);
    this.add_(this.add.text(930, 320, `${car.manufacturer} ${car.name}`, FONT.h3).setOrigin(0.5));
    this.add_(this.add.text(930, 350, `Top Speed ${car.stats.topSpeed} · Accel ${car.stats.acceleration} · Handling ${car.stats.handling}`, FONT.small).setOrigin(0.5));
    this.add_(this.add.text(930, 375, `Nitro ${car.stats.nitroPower} · Grip ${car.stats.grip}`, FONT.small).setOrigin(0.5));
  }

  private cycleCar(dir: number): void {
    if (this.cars.length === 0) return;
    this.carIndex = (this.carIndex + dir + this.cars.length) % this.cars.length;
    audioManager.uiClick();
    this.render();
  }

  private renderDifficultyPicker(): void {
    const y = 450;
    const showOpponents = !NO_OPPONENT_MODES.has(this.preset.mode ?? 'quickRace');
    const difficultyLocked = !!this.preset.difficulty;

    this.add_(this.add.text(40, y, 'Difficulty', FONT.h3));
    if (!difficultyLocked) {
      DIFFICULTIES.forEach((d, i) => {
        const btn = new Button(this, 140 + i * 150, y + 44, DIFFICULTY_SETTINGS[d].label, () => {
          this.difficulty = d;
          audioManager.uiClick();
          this.render();
        }, { width: 130, height: 44, variant: this.difficulty === d ? 'primary' : 'ghost' });
        this.add_(btn);
      });
    } else {
      this.add_(this.add.text(40, y + 30, DIFFICULTY_SETTINGS[this.difficulty].label, { ...FONT.body, color: '#7fdcff' }));
    }

    if (showOpponents) {
      const oy = y + 90;
      this.add_(this.add.text(40, oy, 'Opponents', FONT.h3));
      if (!this.preset.opponentCount) {
        [3, 5, 7].forEach((n, i) => {
          const btn = new Button(this, 140 + i * 130, oy + 44, `${n}`, () => {
            this.opponentCount = n;
            audioManager.uiClick();
            this.render();
          }, { width: 110, height: 44, variant: this.opponentCount === n ? 'primary' : 'ghost' });
          this.add_(btn);
        });
      } else {
        this.add_(this.add.text(40, oy + 30, `${this.opponentCount}`, { ...FONT.body, color: '#7fdcff' }));
      }
    }
  }

  private renderStartButton(): void {
    const car = this.cars[this.carIndex];
    const isEndless = this.preset.mode === 'endless';
    const track = isEndless ? getTrackById('sunrise_highway') : this.tracks[this.trackIndex];
    const canStart = !!car && !!track;

    const btn = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Start Race', () => {
      if (!car || !track) return;
      saveManager.mutate((d) => {
        d.selectedTrackId = track.id;
        d.garage.selectedCarId = car.id;
      });
      const config: RaceConfig = {
        mode: this.preset.mode ?? 'quickRace',
        trackId: track.id,
        carId: car.id,
        difficulty: this.difficulty,
        opponentCount: NO_OPPONENT_MODES.has(this.preset.mode ?? 'quickRace') ? 0 : this.opponentCount,
        careerStageId: this.preset.careerStageId,
        tournament: this.preset.tournament,
        eliminationIntervalSec: this.preset.eliminationIntervalSec,
      };
      audioManager.uiConfirm();
      this.scene.start(SceneKeys.Race3D, { config });
    }, { width: 320, height: 60, disabled: !canStart });
    this.add_(btn);
  }
}
