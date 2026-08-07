/**
 * Thin, defensive wrapper around localStorage. Never throws — storage can be
 * unavailable (private browsing, quota exceeded) and the game must still run
 * (just without persistence) instead of crashing.
 */
export const StorageUtils = {
  isAvailable(): boolean {
    try {
      const testKey = '__vr_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return { ...fallback, ...JSON.parse(raw) } as T;
    } catch (err) {
      console.warn(`[StorageUtils] Failed to read "${key}":`, err);
      return fallback;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[StorageUtils] Failed to write "${key}":`, err);
      return false;
    }
  },

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[StorageUtils] Failed to remove "${key}":`, err);
    }
  },
};
