import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { addSceneChrome } from '../ui/SceneChrome';
import { buildCarVisual } from '../ui/CarPreview';
import { getCarById } from '../cars/CarData';
import { UPGRADE_DATA } from '../upgrades/UpgradeData';
import { upgradeManager } from '../upgrades/UpgradeManager';
import { customizationManager } from '../customization/CustomizationManager';
import { audioManager } from '../audio/AudioManager';
import { globalBus } from '../utils/EventBus';

interface UpgradeSceneData {
  carId: string;
}

export class UpgradeScene extends Phaser.Scene {
  private carId = '';
  private rows: Phaser.GameObjects.GameObject[] = [];
  private chrome?: ReturnType<typeof addSceneChrome>;

  constructor() {
    super(SceneKeys.Upgrade);
  }

  create(data: UpgradeSceneData): void {
    this.carId = data.carId;
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    const car = getCarById(this.carId);
    this.chrome = addSceneChrome(this, car ? `Upgrade — ${car.name}` : 'Upgrade', () => this.scene.start(SceneKeys.Garage));
    if (!car) return;

    const visual = buildCarVisual(this, car, customizationManager.getState(this.carId));
    visual.container.setPosition(150, 200).setScale(2.2);

    this.buildRows();
  }

  private buildRows(): void {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];
    const car = getCarById(this.carId);
    if (!car) return;

    const state = upgradeManager.getState(this.carId);
    const startX = 340;
    const startY = 120;
    const rowH = 68;

    UPGRADE_DATA.forEach((def, i) => {
      const y = startY + i * rowH;
      const level = state[def.category] ?? 0;
      const panel = drawPanel(this, startX, y, GAME_WIDTH - startX - 40, rowH - 10, { alpha: 0.55 });
      const label = this.add.text(startX + 20, y + 12, def.label, FONT.h3);
      const desc = this.add.text(startX + 20, y + 40, def.description, FONT.small);

      const dotsX = startX + 480;
      const dots: Phaser.GameObjects.Arc[] = [];
      for (let d = 0; d < def.maxLevel; d++) {
        const filled = d < level;
        const dot = this.add.circle(dotsX + d * 22, y + rowH / 2 - 5, 7, filled ? COLORS.accentPrimary : 0x2a2f4a);
        dots.push(dot);
      }

      const nextCost = upgradeManager.getNextTierCost(this.carId, def.category);
      const btn = new Button(
        this,
        GAME_WIDTH - 160,
        y + rowH / 2 - 5,
        nextCost === null ? 'MAX' : `${nextCost.toLocaleString()}`,
        () => {
          const result = upgradeManager.purchaseUpgrade(this.carId, def.category);
          globalBus.emit('toast', { message: result.message, kind: result.success ? 'success' : 'warning' });
          if (result.success) {
            audioManager.uiConfirm();
            this.chrome?.refreshCurrency();
            this.buildRows();
          }
        },
        { width: 140, height: 44, disabled: nextCost === null, variant: nextCost === null ? 'ghost' : 'primary' },
      );

      this.rows.push(panel, label, desc, ...dots, btn);
    });

    const totalLevel = upgradeManager.getTotalUpgradeLevel(this.carId);
    const maxTotal = UPGRADE_DATA.length * 5;
    const summary = this.add.text(150, 340, `Total tuning: ${totalLevel} / ${maxTotal}`, FONT.body);
    this.rows.push(summary);
  }
}
