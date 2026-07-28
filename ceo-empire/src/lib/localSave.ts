import type { GameState } from '@/types/game';

const KEY_PREFIX = 'ceo-empire-save-';

export function loadLocalSave(uid: string): GameState | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + uid);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function saveLocalSave(uid: string, state: GameState): void {
  try {
    localStorage.setItem(KEY_PREFIX + uid, JSON.stringify(state));
  } catch {
    // Storage may be full or unavailable (e.g. private browsing) — fail silently.
  }
}
