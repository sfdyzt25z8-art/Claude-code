import Phaser from 'phaser';
import { SceneKeys } from './SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DIFFICULTY_SETTINGS, type Difficulty } from '../utils/Constants';
import { FONT } from '../ui/Theme';
import { Button } from '../ui/Button';
import { ScrollList } from '../ui/ScrollList';
import { addSceneChrome } from '../ui/SceneChrome';
import { settingsManager } from '../save/SettingsManager';
import { saveManager } from '../save/SaveManager';
import type { GraphicsQuality, FpsCap, Language } from '../save/SettingsSchema';
import { globalBus } from '../utils/EventBus';
import { audioManager } from '../audio/AudioManager';

const VOLUME_STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];
const LANGUAGES: [Language, string][] = [['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['ja', '日本語'], ['pt', 'Português']];

export class SettingsScene extends Phaser.Scene {
  private list?: ScrollList;

  constructor() {
    super(SceneKeys.Settings);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgDark);
    addSceneChrome(this, 'Settings', () => this.scene.start(SceneKeys.MainMenu));
    this.list = new ScrollList(this, 40, 110, GAME_WIDTH - 80, GAME_HEIGHT - 190);
    this.render();
    this.buildFooter();
  }

  private render(): void {
    this.list?.content.removeAll(true);
    const s = settingsManager.get();
    let y = 0;
    const row = (label: string, node: () => number) => {
      this.list!.content.add(this.text(0, y, label, FONT.h3));
      y += node() + 34;
    };

    row('Graphics Quality', () => this.choiceRow<GraphicsQuality>(y + 46, ['low', 'medium', 'high'], s.graphicsQuality, (v) => settingsManager.update({ graphicsQuality: v }), (v) => v.toUpperCase()));
    row('FPS Cap', () => this.choiceRow<FpsCap>(y + 46, [30, 60, 120, 0], s.fpsCap, (v) => settingsManager.update({ fpsCap: v }), (v) => (v === 0 ? 'Uncapped' : `${v}`)));
    row('Particle Effects', () => this.toggleRow(y + 46, s.particlesEnabled, (v) => settingsManager.update({ particlesEnabled: v })));
    row('Motion Blur', () => this.toggleRow(y + 46, s.motionBlur, (v) => settingsManager.update({ motionBlur: v })));
    row('Dynamic Lighting', () => this.toggleRow(y + 46, s.dynamicLighting, (v) => settingsManager.update({ dynamicLighting: v })));
    row('Master Volume', () => this.volumeRow(y + 46, s.masterVolume, (v) => settingsManager.update({ masterVolume: v })));
    row('Music Volume', () => this.volumeRow(y + 46, s.musicVolume, (v) => settingsManager.update({ musicVolume: v })));
    row('SFX Volume', () => this.volumeRow(y + 46, s.sfxVolume, (v) => settingsManager.update({ sfxVolume: v })));
    row('Control Scheme', () => this.choiceRow(y + 46, ['auto', 'keyboard', 'touch', 'gamepad'] as const, s.controlScheme, (v) => settingsManager.update({ controlScheme: v }), (v) => v));
    row('Steering Assist', () => this.toggleRow(y + 46, s.steeringAssist, (v) => settingsManager.update({ steeringAssist: v })));
    row('Default Difficulty', () => this.choiceRow<Difficulty>(y + 46, ['easy', 'normal', 'hard', 'expert'], s.defaultDifficulty, (v) => settingsManager.update({ defaultDifficulty: v }), (v) => DIFFICULTY_SETTINGS[v].label));
    row('Language', () => this.choiceRow<Language>(y + 46, LANGUAGES.map(([l]) => l), s.language, (v) => settingsManager.update({ language: v }), (v) => LANGUAGES.find((l) => l[0] === v)?.[1] ?? v));

    this.list!.content.add(this.text(0, y, 'Accessibility', FONT.h2));
    y += 50;
    row('Screen Shake', () => this.toggleRow(y + 46, s.accessibility.screenShake, (v) => settingsManager.updateAccessibility({ screenShake: v })));
    row('High Contrast UI', () => this.toggleRow(y + 46, s.accessibility.highContrastUI, (v) => settingsManager.updateAccessibility({ highContrastUI: v })));
    row('Reduce Motion', () => this.toggleRow(y + 46, s.accessibility.reduceMotion, (v) => settingsManager.updateAccessibility({ reduceMotion: v })));
    row('Colorblind Assist', () => this.toggleRow(y + 46, s.accessibility.colorblindAssist, (v) => settingsManager.updateAccessibility({ colorblindAssist: v })));
    row('Large Text', () => this.toggleRow(y + 46, s.accessibility.largeText, (v) => settingsManager.updateAccessibility({ largeText: v })));

    this.list!.setContentHeight(y + 40);
  }

  private text(x: number, y: number, t: string, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
    const obj = this.add.text(x, y, t, style);
    this.list!.content.add(obj);
    return obj;
  }

  private choiceRow<T extends string | number>(y: number, options: readonly T[], current: T, onSelect: (v: T) => void, format: (v: T) => string): number {
    options.forEach((opt, i) => {
      const btn = new Button(this, 110 + i * 150, y, format(opt), () => {
        audioManager.uiClick();
        onSelect(opt);
        this.render();
      }, { width: 130, height: 40, variant: opt === current ? 'primary' : 'ghost' });
      this.list!.content.add(btn);
    });
    return 40;
  }

  private toggleRow(y: number, current: boolean, onToggle: (v: boolean) => void): number {
    const btn = new Button(this, 110, y, current ? 'ON' : 'OFF', () => {
      audioManager.uiClick();
      onToggle(!current);
      this.render();
    }, { width: 130, height: 40, variant: current ? 'primary' : 'ghost' });
    this.list!.content.add(btn);
    return 40;
  }

  private volumeRow(y: number, current: number, onSelect: (v: number) => void): number {
    VOLUME_STEPS.forEach((step, i) => {
      const btn = new Button(this, 110 + i * 90, y, `${Math.round(step * 100)}`, () => {
        onSelect(step);
        audioManager.uiClick();
        this.render();
      }, { width: 80, height: 40, variant: Math.abs(step - current) < 0.05 ? 'primary' : 'ghost' });
      this.list!.content.add(btn);
    });
    return 40;
  }

  private buildFooter(): void {
    new Button(this, GAME_WIDTH / 2 - 180, GAME_HEIGHT - 50, 'Reset Settings', () => {
      settingsManager.reset();
      this.render();
      globalBus.emit('toast', { message: 'Settings reset to defaults', kind: 'info' });
    }, { width: 300, height: 46, variant: 'secondary' });

    new Button(this, GAME_WIDTH / 2 + 180, GAME_HEIGHT - 50, 'Erase Save Data', () => {
      saveManager.resetAll();
      globalBus.emit('toast', { message: 'Save data erased', kind: 'warning' });
      this.scene.start(SceneKeys.MainMenu);
    }, { width: 300, height: 46, variant: 'danger' });
  }
}
