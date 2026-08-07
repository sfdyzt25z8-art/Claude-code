import { StorageUtils } from '../utils/StorageUtils';
import { SETTINGS_KEY } from '../utils/Constants';
import { createDefaultSettings, type SettingsData } from './SettingsSchema';
import { globalBus } from '../utils/EventBus';
import { audioManager } from '../audio/AudioManager';

type SettingsListener = (settings: SettingsData) => void;

export class SettingsManager {
  private settings: SettingsData;
  private listeners = new Set<SettingsListener>();

  constructor() {
    this.settings = StorageUtils.get<SettingsData>(SETTINGS_KEY, createDefaultSettings());
    this.applyAudio();
  }

  get(): Readonly<SettingsData> {
    return this.settings;
  }

  update(patch: Partial<SettingsData>): void {
    this.settings = { ...this.settings, ...patch };
    this.persist();
  }

  updateAccessibility(patch: Partial<SettingsData['accessibility']>): void {
    this.settings = { ...this.settings, accessibility: { ...this.settings.accessibility, ...patch } };
    this.persist();
  }

  private persist(): void {
    StorageUtils.set(SETTINGS_KEY, this.settings);
    this.applyAudio();
    this.listeners.forEach((l) => l(this.settings));
    globalBus.emit('settings-changed', this.settings as unknown as Record<string, unknown>);
  }

  private applyAudio(): void {
    audioManager.setVolumes({
      master: this.settings.masterVolume,
      music: this.settings.musicVolume,
      sfx: this.settings.sfxVolume,
    });
  }

  subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.settings = createDefaultSettings();
    this.persist();
  }
}

export const settingsManager = new SettingsManager();
