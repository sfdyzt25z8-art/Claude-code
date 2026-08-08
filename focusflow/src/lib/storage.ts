/**
 * Centralized localStorage access. Every read/write in the app goes through
 * here so storage errors (quota exceeded, corrupted JSON, private-browsing
 * restrictions) are handled in one place instead of scattered try/catches.
 */

const isStorageAvailable = (() => {
  try {
    const testKey = '__focusflow_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
})();

export function readJSON<T>(key: string, fallback: T): T {
  if (!isStorageAvailable) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch (error) {
    console.warn(`[storage] Failed to read "${key}", falling back to default.`, error);
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): boolean {
  if (!isStorageAvailable) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to write "${key}".`, error);
    return false;
  }
}

export function removeKey(key: string): void {
  if (!isStorageAvailable) return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] Failed to remove "${key}".`, error);
  }
}

export function isPersistenceAvailable(): boolean {
  return isStorageAvailable;
}

/** A minimal Storage-compatible adapter for zustand's persist middleware,
 * routed through the error-handled helpers above. */
export const zustandStorageAdapter = {
  getItem: (name: string): string | null => {
    if (!isStorageAvailable) return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (!isStorageAvailable) return;
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      console.warn(`[storage] Failed to persist "${name}". Changes may not be saved.`, error);
    }
  },
  removeItem: (name: string): void => {
    removeKey(name);
  },
};
