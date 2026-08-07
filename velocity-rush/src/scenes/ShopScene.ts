import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { drawPanel } from '../ui/Panel';
import { ScrollList } from '../ui/ScrollList';
import { addSceneChrome } from '../ui/SceneChrome';
import { buildCarVisual } from '../ui/CarPreview';
import { CAR_DATA } from '../cars/CarData';
import { progressionManager } from '../economy/ProgressionManager';
import { customizationManager } from '../customization/CustomizationManager';
import { audioManager } from '../audio/AudioManager';
import { globalBus } from '../utils/EventBus';

const ROW_HEIGHT = 108;

export class ShopScene extends Phaser.Scene {
  private chrome?: ReturnType<typeof addSceneChrome>;
  private list?: ScrollList;

  constructor() {
    super(SceneKeys.Shop);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    this.chrome = addSceneChrome(this, 'Shop', () => this.scene.start(SceneKeys.MainMenu));
    this.add.text(GAME_WIDTH / 2, 96, 'Every car in Velocity Rush — unlock by level, trophies, or coins', FONT.small).setOrigin(0.5);

    this.list = new ScrollList(this, 40, 120, GAME_WIDTH - 80, GAME_HEIGHT - 160);
    this.buildRows();
  }

  private buildRows(): void {
    if (!this.list) return;
    const sorted = [...CAR_DATA].sort((a, b) => a.price - b.price);
    sorted.forEach((car, i) => {
      const y = i * (ROW_HEIGHT + 12);
      const owned = progressionManager.isCarOwned(car.id);
      const eligibility = progressionManager.checkCarEligibility(car.id);

      const panel = drawPanel(this, 0, y, GAME_WIDTH - 120, ROW_HEIGHT, { alpha: owned ? 0.35 : 0.65 });
      this.list!.content.add(panel);

      const visual = buildCarVisual(this, car, customizationManager.getState(car.id), false);
      visual.container.setPosition(80, y + ROW_HEIGHT / 2);
      visual.container.setScale(1.5);
      if (!owned) visual.container.setAlpha(0.55);
      this.list!.content.add(visual.container);

      const name = this.add.text(160, y + 22, `${car.manufacturer} ${car.name}`, FONT.h3);
      const cls = this.add.text(160, y + 54, `${car.class.toUpperCase()} · Top Speed ${car.stats.topSpeed} · Accel ${car.stats.acceleration}`, FONT.small);
      this.list!.content.add([name, cls]);

      const actionLabel = owned ? 'Owned' : eligibility.eligible ? (car.price > 0 ? `Buy — ${car.price.toLocaleString()}` : 'Unlock') : eligibility.reason;
      const btn = new Button(this, GAME_WIDTH - 300, y + ROW_HEIGHT / 2, actionLabel, () => {
        if (owned) return;
        const result = progressionManager.purchaseCar(car.id);
        globalBus.emit('toast', { message: result.message, kind: result.success ? 'success' : 'warning' });
        if (result.success) {
          audioManager.uiConfirm();
          this.chrome?.refreshCurrency();
          this.refresh();
        }
      }, { width: 260, height: 52, disabled: owned || !eligibility.eligible, variant: owned ? 'ghost' : 'primary' });
      this.list!.content.add(btn);
    });
    this.list.setContentHeight(sorted.length * (ROW_HEIGHT + 12));
  }

  private refresh(): void {
    this.list?.content.removeAll(true);
    this.buildRows();
  }
}
