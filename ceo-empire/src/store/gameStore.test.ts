import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { createInitialState, PRESTIGE_MIN_NET_WORTH } from '@/lib/gameEngine';

describe('gameStore.prestige', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('refuses to prestige below the net worth threshold', () => {
    const result = useGameStore.getState().prestige();
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().state.prestige.count).toBe(0);
  });

  it('resets the empire and increments prestige count once eligible', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: PRESTIGE_MIN_NET_WORTH } }));
    const result = useGameStore.getState().prestige();
    expect(result.ok).toBe(true);
    const state = useGameStore.getState().state;
    expect(state.prestige.count).toBe(1);
    expect(state.cash).toBe(10_000);
    expect(state.businesses).toEqual([]);
  });

  it('pushes a notification when prestiging succeeds', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: PRESTIGE_MIN_NET_WORTH } }));
    useGameStore.getState().prestige();
    const notifications = useGameStore.getState().notifications;
    expect(notifications.some((n) => n.title.includes('Prestiged'))).toBe(true);
  });
});
