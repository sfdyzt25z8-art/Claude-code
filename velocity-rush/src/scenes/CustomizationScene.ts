import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { drawPanel } from '../ui/Panel';
import { ScrollList } from '../ui/ScrollList';
import { addSceneChrome } from '../ui/SceneChrome';
import { buildCarVisual, type CarVisual } from '../ui/CarPreview';
import { getCarById } from '../cars/CarData';
import { CUSTOMIZATION_DATA } from '../customization/CustomizationData';
import { customizationManager } from '../customization/CustomizationManager';
import { audioManager } from '../audio/AudioManager';
import { globalBus } from '../utils/EventBus';

interface CustomizationSceneData {
  carId: string;
}

export class CustomizationScene extends Phaser.Scene {
  private carId = '';
  private visual?: CarVisual;
  private list?: ScrollList;
  private chrome?: ReturnType<typeof addSceneChrome>;

  constructor() {
    super(SceneKeys.Customization);
  }

  create(data: CustomizationSceneData): void {
    this.carId = data.carId;
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    const car = getCarById(this.carId);
    this.chrome = addSceneChrome(this, car ? `Customize — ${car.name}` : 'Customize', () => this.scene.start(SceneKeys.Garage));
    if (!car) return;

    drawPanel(this, 20, 100, 300, 300, { alpha: 0.4 });
    this.renderPreview();

    this.list = new ScrollList(this, 340, 100, GAME_WIDTH - 380, GAME_HEIGHT - 140);
    this.buildSlots();
  }

  private renderPreview(): void {
    this.visual?.container.destroy();
    const car = getCarById(this.carId)!;
    const visual = buildCarVisual(this, car, customizationManager.getState(this.carId));
    visual.container.setPosition(170, 250).setScale(3);
    this.visual = visual;
  }

  private buildSlots(): void {
    if (!this.list) return;
    let y = 0;
    const state = customizationManager.getState(this.carId);

    for (const def of CUSTOMIZATION_DATA) {
      const header = this.add.text(0, y, def.label, FONT.h3);
      this.list.content.add(header);
      y += 40;

      let x = 0;
      const rowStartY = y;
      let rowMaxHeight = 0;
      for (const option of def.options) {
        const owned = customizationManager.isOptionOwned(this.carId, def.slot, option.id);
        const selected = state[def.slot] === option.id;
        const swatchWidth = option.color !== undefined ? 46 : Math.max(90, option.label.length * 9);
        if (x + swatchWidth > GAME_WIDTH - 420) {
          x = 0;
          y += 58;
        }
        this.buildSwatch(def.slot, option, x, y, swatchWidth, owned, selected);
        x += swatchWidth + 12;
        rowMaxHeight = 58;
      }
      y = Math.max(y, rowStartY) + rowMaxHeight + 20;
    }

    this.list.setContentHeight(y);
  }

  private buildSwatch(
    slot: string,
    option: { id: string; label: string; color?: number; price: number },
    x: number,
    y: number,
    width: number,
    owned: boolean,
    selected: boolean,
  ): void {
    if (!this.list) return;
    const height = 44;
    const gfx = this.add.graphics();
    gfx.fillStyle(option.color ?? COLORS.bgPanelLight, 1);
    gfx.fillRoundedRect(x, y, width, height, 10);
    gfx.lineStyle(selected ? 3 : 1, selected ? COLORS.accentPrimary : 0xffffff, selected ? 1 : 0.15);
    gfx.strokeRoundedRect(x, y, width, height, 10);
    this.list.content.add(gfx);

    if (option.color === undefined) {
      const label = this.add.text(x + width / 2, y + height / 2, option.label, { ...FONT.small, color: selected ? '#0a0e27' : '#e9f3ff' }).setOrigin(0.5);
      if (selected) label.setColor('#0a0e27');
      this.list.content.add(label);
    }
    if (!owned && option.price > 0) {
      const priceTag = this.add.text(x + width / 2, y + height + 12, `${option.price}`, { ...FONT.small, fontSize: '12px' }).setOrigin(0.5);
      this.list.content.add(priceTag);
    }

    const zone = this.add.zone(x, y, width, height).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => {
      const result = customizationManager.purchaseAndApply(this.carId, slot as never, option.id);
      globalBus.emit('toast', { message: result.message, kind: result.success ? 'success' : 'warning' });
      if (result.success) {
        audioManager.uiConfirm();
        this.renderPreview();
        this.list?.content.removeAll(true);
        this.buildSlots();
        this.chrome?.refreshCurrency();
      }
    });
    this.list.content.add(zone);
  }
}
