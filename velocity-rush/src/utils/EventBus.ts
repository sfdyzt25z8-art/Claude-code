type Listener<T> = (payload: T) => void;

/**
 * Minimal typed pub/sub bus used for cross-scene / cross-system communication
 * (e.g. economy rewards -> UI toasts, settings changes -> audio manager).
 */
export class EventBus<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event]!.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners[event]?.delete(listener);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach((l) => l(payload));
  }

  clear(): void {
    this.listeners = {};
  }
}

export interface GlobalEvents {
  'coins-changed': { amount: number; total: number };
  'xp-changed': { amount: number; total: number; leveledUp: boolean; level: number };
  'settings-changed': Record<string, unknown>;
  'achievement-unlocked': { id: string; title: string };
  'toast': { message: string; kind?: 'info' | 'success' | 'warning' | 'error' };
  [key: string]: unknown;
}

/** App-wide singleton event bus. */
export const globalBus = new EventBus<GlobalEvents>();
