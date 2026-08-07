import { StorageUtils } from '../utils/StorageUtils';
import { STORAGE_KEY } from '../utils/Constants';
import { createDefaultSave, SAVE_VERSION, type SaveData } from './SaveSchema';

type SaveListener = (state: SaveData) => void;

/**
 * Owns the single source of truth for all persistent player state and
 * debounces writes to localStorage so rapid mutations (e.g. during a race)
 * don't thrash disk I/O. Domain managers (economy, upgrades, customization,
 * achievements...) mutate through `mutate()` rather than touching storage
 * directly, keeping persistence concerns in one place.
 */
export class SaveManager {
  private state: SaveData;
  private listeners = new Set<SaveListener>();
  private saveTimer: number | null = null;

  constructor() {
    this.state = this.load();
  }

  private load(): SaveData {
    const fallback = createDefaultSave();
    if (!StorageUtils.isAvailable()) return fallback;
    const loaded = StorageUtils.get<SaveData>(STORAGE_KEY, fallback);
    if (loaded.version !== SAVE_VERSION) {
      // Simple strategy for v1: keep progress fields we trust, reset the rest.
      return { ...fallback, profile: loaded.profile ?? fallback.profile };
    }
    return loaded;
  }

  getState(): Readonly<SaveData> {
    return this.state;
  }

  /** Apply a mutation to the save data, then persist (debounced) and notify subscribers. */
  mutate(fn: (draft: SaveData) => void): void {
    fn(this.state);
    this.notify();
    this.scheduleSave();
  }

  subscribe(listener: SaveListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state));
  }

  private scheduleSave(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.flush(), 400);
  }

  /** Force an immediate synchronous write (e.g. before the tab unloads). */
  flush(): void {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    StorageUtils.set(STORAGE_KEY, this.state);
  }

  resetAll(): void {
    this.state = createDefaultSave();
    this.notify();
    this.flush();
  }
}

/** App-wide singleton save store. */
export const saveManager = new SaveManager();

window.addEventListener('beforeunload', () => saveManager.flush());
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveManager.flush();
});
