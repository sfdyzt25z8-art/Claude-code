import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { TEX } from '../assets/ProceduralTextures';
import type { RaceResultData } from '../engine/RaceTypes';
import { getTrackById } from '../tracks/TrackData';
import { CAREER_STAGES, getCareerStage } from '../engine/CareerData';
import { maxPossiblePoints } from '../engine/Tournament';
import { audioManager } from '../audio/AudioManager';

interface ResultsSceneData {
  result: RaceResultData;
}

const OUTCOME_LABEL: Record<RaceResultData['outcome'], string> = {
  finished: 'RACE COMPLETE',
  dnf: 'DID NOT FINISH',
  eliminated: 'ELIMINATED',
  quit: 'RACE ENDED',
};

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Results);
  }

  create(data: ResultsSceneData): void {
    const result = data.result;
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    const track = getTrackById(result.config.trackId);

    const won = result.outcome === 'finished' && result.position === 1;
    audioManager.playMusic('menu');
    if (won) audioManager.achievement();
    else audioManager.uiConfirm();

    this.add.text(GAME_WIDTH / 2, 50, OUTCOME_LABEL[result.outcome], { ...FONT.h1, fontSize: '46px', color: won ? '#ffc371' : '#e9f3ff' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 100, track?.name ?? '', FONT.small).setOrigin(0.5);

    if (result.outcome !== 'dnf' && result.config.mode !== 'drift' && result.config.mode !== 'endless') {
      this.add.text(GAME_WIDTH / 2, 130, `Finished P${result.position} of ${result.totalRacers}`, { ...FONT.h3 }).setOrigin(0.5);
    }

    this.buildStatsPanel(result);
    this.buildRewardPanel(result);

    if (result.config.careerStageId) {
      const stage = getCareerStage(result.config.careerStageId);
      const label = result.careerStagePassed ? `✓ ${stage?.title} passed!` : `Stage not passed — need P${stage?.requiredPosition} or better`;
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 160, label, { ...FONT.body, color: result.careerStagePassed ? '#38ef7d' : '#ff4d5e' }).setOrigin(0.5);
    }

    if (result.tournament) this.buildTournamentPanel(result);

    this.buildButtons(result);
  }

  private buildTournamentPanel(result: RaceResultData): void {
    const t = result.tournament!;
    const maxPoints = maxPossiblePoints(t.totalRounds);
    const label = t.isFinalRound
      ? `🏆 Tournament Complete — ${t.totalPoints} / ${maxPoints} points`
      : `Tournament — Round ${t.round} / ${t.totalRounds} — +${t.pointsThisRound} points this round (${t.totalPoints} total)`;
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 190, label, { ...FONT.body, color: '#ffc371' }).setOrigin(0.5);
    if (t.isFinalRound && (t.bonusCoins > 0 || t.bonusTrophies > 0)) {
      const bonusLabel = [t.bonusCoins > 0 ? `+${t.bonusCoins} bonus coins` : '', t.bonusTrophies > 0 ? `+${t.bonusTrophies} bonus trophies` : '']
        .filter(Boolean)
        .join('  ·  ');
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 160, bonusLabel, FONT.small).setOrigin(0.5);
    }
  }

  private buildStatsPanel(result: RaceResultData): void {
    const panel = drawPanel(this, 60, 160, GAME_WIDTH / 2 - 90, 320, { alpha: 0.6 });
    void panel;
    let y = 190;
    const line = (label: string, value: string) => {
      this.add.text(90, y, label, FONT.small);
      this.add.text(GAME_WIDTH / 2 - 60, y, value, FONT.body).setOrigin(1, 0);
      y += 34;
    };
    line('Race Time', formatTime(result.raceTimeMs));
    if (result.bestLapMs) line('Best Lap', formatTime(result.bestLapMs));
    if (result.driftScore > 0) line('Drift Score', `${result.driftScore}`);
    if (result.stuntScore > 0) line('Stunt Score', `${result.stuntScore}`);
    if (result.distanceMeters > 0) line('Distance', `${result.distanceMeters} m`);
    line('Clean Driving', result.cleanDriving ? 'Yes' : 'No');
    if (result.lapTimes.length > 0) {
      result.lapTimes.forEach((t, i) => line(`Lap ${i + 1}`, formatTime(t)));
    }
  }

  private buildRewardPanel(result: RaceResultData): void {
    const x = GAME_WIDTH / 2 + 30;
    const panel = drawPanel(this, x, 160, GAME_WIDTH / 2 - 90, 320, { alpha: 0.6, stroke: COLORS.accentGold, strokeAlpha: 0.5 });
    void panel;
    this.add.text(x + 20, 176, 'Rewards', FONT.h3);
    let y = 216;
    for (const entry of result.rewardBreakdown) {
      this.add.text(x + 20, y, entry.label, FONT.small);
      this.add.text(x + GAME_WIDTH / 2 - 120, y, `+${entry.coins}c +${entry.xp}xp`, FONT.small).setOrigin(1, 0);
      y += 28;
    }
    this.add.image(x + 30, y + 20, TEX.coin);
    this.add.text(x + 50, y + 20, `+${result.coinsEarned.toLocaleString()} coins`, FONT.h3).setOrigin(0, 0.5);
    this.add.text(x + 50, y + 55, `+${result.xpEarned} XP`, FONT.body).setOrigin(0, 0.5);
    if (result.trophiesEarned > 0) {
      this.add.text(x + 50, y + 85, `+${result.trophiesEarned} 🏆`, FONT.body).setOrigin(0, 0.5);
    }
    if (result.newAchievements.length > 0) {
      this.add.text(x + 20, y + 120, `${result.newAchievements.length} new achievement(s)!`, { ...FONT.small, color: '#ffc371' });
    }
  }

  private buildButtons(result: RaceResultData): void {
    const y = GAME_HEIGHT - 70;
    new Button(this, GAME_WIDTH / 2 - 320, y, 'Retry', () => {
      this.scene.start(SceneKeys.Race3D, { config: result.config });
    }, { width: 220, height: 54, variant: 'secondary' });

    const nextStage = result.config.careerStageId && result.careerStagePassed
      ? CAREER_STAGES[CAREER_STAGES.findIndex((s) => s.id === result.config.careerStageId) + 1]
      : undefined;

    if (result.tournament && !result.tournament.isFinalRound) {
      new Button(this, GAME_WIDTH / 2, y, 'Next Race →', () => {
        const t = result.config.tournament!;
        this.scene.start(SceneKeys.RaceSetup, {
          preset: {
            mode: 'tournament', difficulty: result.config.difficulty, opponentCount: result.config.opponentCount,
            tournament: { round: t.round + 1, totalRounds: t.totalRounds, trackIds: t.trackIds, pointsSoFar: result.tournament!.totalPoints },
          },
        });
      }, { width: 220, height: 54 });
    } else if (result.tournament) {
      new Button(this, GAME_WIDTH / 2, y, 'Finish Tournament', () => {
        this.scene.start(SceneKeys.ModeSelect);
      }, { width: 220, height: 54 });
    } else if (nextStage) {
      new Button(this, GAME_WIDTH / 2, y, 'Next Stage', () => {
        this.scene.start(SceneKeys.RaceSetup, {
          preset: {
            mode: nextStage.mode, trackId: nextStage.trackId, difficulty: nextStage.difficulty,
            opponentCount: nextStage.opponentCount, careerStageId: nextStage.id,
          },
        });
      }, { width: 220, height: 54 });
    } else {
      new Button(this, GAME_WIDTH / 2, y, result.config.careerStageId ? 'Career Map' : 'Race Again', () => {
        this.scene.start(result.config.careerStageId ? SceneKeys.Career : SceneKeys.ModeSelect);
      }, { width: 220, height: 54 });
    }

    new Button(this, GAME_WIDTH / 2 + 320, y, 'Main Menu', () => {
      this.scene.start(SceneKeys.MainMenu);
    }, { width: 220, height: 54, variant: 'ghost' });
  }
}

function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return `${minutes}:${seconds.padStart(5, '0')}`;
}
