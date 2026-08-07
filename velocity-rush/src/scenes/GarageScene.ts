import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { StatBar } from '../ui/StatBar';
import { addSceneChrome } from '../ui/SceneChrome';
import { buildCarVisual } from '../ui/CarPreview';
import { CAR_DATA } from '../cars/CarData';
import { applyUpgrades } from '../cars/CarPerformance';
import { upgradeManager } from '../upgrades/UpgradeManager';
import { customizationManager } from '../customization/CustomizationManager';
import { progressionManager } from '../economy/ProgressionManager';
import { saveManager } from '../save/SaveManager';
import { audioManager } from '../audio/AudioManager';
import { globalBus } from '../utils/EventBus';

export class GarageScene extends Phaser.Scene {
  private carIndex = 0;
  private previewContainer?: Phaser.GameObjects.Container;
  private infoTexts: Phaser.GameObjects.GameObject[] = [];
  private statBars: StatBar[] = [];
  private actionButtons: Phaser.GameObjects.GameObject[] = [];
  private chrome?: ReturnType<typeof addSceneChrome>;

  constructor() {
    super(SceneKeys.Garage);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    const state = saveManager.getState();
    this.carIndex = Math.max(0, CAR_DATA.findIndex((c) => c.id === state.garage.selectedCarId));

    this.chrome = addSceneChrome(this, 'Garage', () => this.scene.start(SceneKeys.MainMenu));

    drawPanel(this, 40, 110, GAME_WIDTH - 80, GAME_HEIGHT - 150, { alpha: 0.5 });

    this.buildArrows();
    this.renderCar();
  }

  private buildArrows(): void {
    new Button(this, 90, GAME_HEIGHT / 2 - 40, '◀', () => this.cycle(-1), { width: 60, height: 60, variant: 'ghost' });
    new Button(this, GAME_WIDTH - 90, GAME_HEIGHT / 2 - 40, '▶', () => this.cycle(1), { width: 60, height: 60, variant: 'ghost' });
  }

  private cycle(dir: number): void {
    this.carIndex = (this.carIndex + dir + CAR_DATA.length) % CAR_DATA.length;
    audioManager.uiClick();
    this.renderCar();
  }

  private renderCar(): void {
    this.previewContainer?.destroy();
    this.infoTexts.forEach((t) => t.destroy());
    this.infoTexts = [];
    this.statBars.forEach((b) => b.destroy());
    this.statBars = [];
    this.actionButtons.forEach((b) => b.destroy());
    this.actionButtons = [];

    const car = CAR_DATA[this.carIndex];
    const owned = progressionManager.isCarOwned(car.id);
    const eligibility = progressionManager.checkCarEligibility(car.id);
    const customization = customizationManager.getState(car.id);

    const visual = buildCarVisual(this, car, customization);
    visual.container.setPosition(GAME_WIDTH / 2 - 40, GAME_HEIGHT / 2 - 30);
    visual.container.setScale(2.6);
    if (!owned) visual.container.setAlpha(0.4);
    this.previewContainer = visual.container;

    const nameText = this.add.text(GAME_WIDTH / 2 - 40, GAME_HEIGHT / 2 + 90, `${car.manufacturer} ${car.name}`, FONT.h2).setOrigin(0.5);
    const classText = this.add.text(GAME_WIDTH / 2 - 40, GAME_HEIGHT / 2 + 125, `${car.class.toUpperCase()} CLASS`, { ...FONT.small, color: '#ffc371' }).setOrigin(0.5);
    const descText = this.add.text(GAME_WIDTH / 2 - 40, GAME_HEIGHT / 2 + 150, car.description, { ...FONT.small, wordWrap: { width: 380 } }).setOrigin(0.5, 0);
    this.infoTexts.push(nameText, classText, descText);

    const upgrades = upgradeManager.getState(car.id);
    const effectiveStats = applyUpgrades(car.stats, upgrades);
    const statsX = GAME_WIDTH - 420;
    let statsY = 150;
    const statPanel = drawPanel(this, statsX - 20, statsY - 20, 380, 260, { alpha: 0.6 });
    this.infoTexts.push(statPanel);
    const labels: [string, keyof typeof effectiveStats, number][] = [
      ['Top Speed', 'topSpeed', COLORS.accentSecondary],
      ['Acceleration', 'acceleration', COLORS.accentGold],
      ['Braking', 'braking', COLORS.success],
      ['Handling', 'handling', COLORS.accentPrimary],
      ['Grip', 'grip', COLORS.neon],
      ['Nitro Power', 'nitroPower', 0xff5f9d],
      ['Weight', 'weight', COLORS.textMuted],
    ];
    labels.forEach(([label, key, color], i) => {
      const bar = new StatBar(this, statsX, statsY + i * 34, 340, label, effectiveStats[key], color);
      this.statBars.push(bar);
    });

    // Owned / unlock section
    if (owned) {
      const isSelected = saveManager.getState().garage.selectedCarId === car.id;
      const selectBtn = new Button(this, GAME_WIDTH / 2 - 260, GAME_HEIGHT - 70, isSelected ? 'Selected ✓' : 'Select', () => {
        saveManager.mutate((d) => (d.garage.selectedCarId = car.id));
        audioManager.uiConfirm();
        this.renderCar();
      }, { width: 200, height: 52, variant: isSelected ? 'secondary' : 'primary', disabled: isSelected });
      const upgradeBtn = new Button(this, GAME_WIDTH / 2 - 40, GAME_HEIGHT - 70, 'Upgrade', () => {
        this.scene.start(SceneKeys.Upgrade, { carId: car.id });
      }, { width: 200, height: 52, variant: 'secondary' });
      const customizeBtn = new Button(this, GAME_WIDTH / 2 + 180, GAME_HEIGHT - 70, 'Customize', () => {
        this.scene.start(SceneKeys.Customization, { carId: car.id });
      }, { width: 200, height: 52, variant: 'secondary' });
      const testDriveBtn = new Button(this, GAME_WIDTH / 2 + 400, GAME_HEIGHT - 70, 'Test Drive', () => {
        this.scene.start(SceneKeys.Race, {
          config: { mode: 'testDrive', trackId: saveManager.getState().selectedTrackId, carId: car.id, difficulty: 'normal', opponentCount: 0 },
        });
      }, { width: 180, height: 52, variant: 'ghost' });
      this.actionButtons.push(selectBtn, upgradeBtn, customizeBtn, testDriveBtn);
    } else {
      const priceLabel = car.price > 0 ? `${car.price.toLocaleString()} coins` : eligibility.reason;
      const buyBtn = new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 70, eligibility.eligible ? `Unlock — ${priceLabel}` : eligibility.reason, () => {
        const result = progressionManager.purchaseCar(car.id);
        globalBus.emit('toast', { message: result.message, kind: result.success ? 'success' : 'warning' });
        if (result.success) {
          audioManager.uiConfirm();
          this.renderCar();
        }
      }, { width: 480, height: 52, disabled: !eligibility.eligible });
      this.actionButtons.push(buyBtn);
    }

    this.chrome?.refreshCurrency();
  }
}
