import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { createInitialState, PRESTIGE_MIN_NET_WORTH } from '@/lib/gameEngine';
import { xpForNextLevel, levelProgressFromXp } from '@/data/levels';
import { getActivity, activityXpReward } from '@/data/activities';

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

describe('gameStore.trainEmployee', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  function hireCashier() {
    useGameStore.getState().hireEmployee('cashier', null);
    return useGameStore.getState().state.employees[0].id;
  }

  it('spends cash and raises the employee skill level by one', () => {
    const employeeId = hireCashier();
    const cashBefore = useGameStore.getState().state.cash;

    const result = useGameStore.getState().trainEmployee(employeeId);

    expect(result.ok).toBe(true);
    const employee = useGameStore.getState().state.employees[0];
    expect(employee.skillLevel).toBe(1);
    expect(useGameStore.getState().state.cash).toBeLessThan(cashBefore);
  });

  it('fails without touching state when cash is insufficient', () => {
    const employeeId = hireCashier();
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 0 } }));

    const result = useGameStore.getState().trainEmployee(employeeId);

    expect(result.ok).toBe(false);
    expect(useGameStore.getState().state.employees[0].skillLevel).toBe(0);
  });

  it('fails for an employee id that does not exist', () => {
    const result = useGameStore.getState().trainEmployee('nope');
    expect(result.ok).toBe(false);
  });

  it('refuses to train past the max skill level', () => {
    const employeeId = hireCashier();
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 10_000_000 } }));
    for (let i = 0; i < 5; i++) {
      expect(useGameStore.getState().trainEmployee(employeeId).ok).toBe(true);
    }
    const result = useGameStore.getState().trainEmployee(employeeId);
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().state.employees[0].skillLevel).toBe(5);
  });
});

describe('gameStore.buyLifestyleItem', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('spends cash, raises reputation, and tracks the purchase', () => {
    const reputationBefore = useGameStore.getState().state.reputation;

    const result = useGameStore.getState().buyLifestyleItem('designer_suit');

    expect(result.ok).toBe(true);
    const state = useGameStore.getState().state;
    expect(state.cash).toBe(10_000 - 800);
    expect(state.reputation).toBeGreaterThan(reputationBefore);
    expect(state.totalLifestyleSpend).toBe(800);
    expect(state.lifestyleOwned.designer_suit).toBe(1);
  });

  it('accumulates quantity and spend across repeat purchases', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 100_000 } }));
    useGameStore.getState().buyLifestyleItem('designer_suit');
    useGameStore.getState().buyLifestyleItem('designer_suit');

    const state = useGameStore.getState().state;
    expect(state.lifestyleOwned.designer_suit).toBe(2);
    expect(state.totalLifestyleSpend).toBe(1600);
  });

  it('caps reputation at 100', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 10_000_000, reputation: 99 } }));
    useGameStore.getState().buyLifestyleItem('private_jet'); // reputationBoost 20
    expect(useGameStore.getState().state.reputation).toBe(100);
  });

  it('fails without touching state when cash is insufficient', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 100 } }));
    const result = useGameStore.getState().buyLifestyleItem('designer_suit');
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().state.cash).toBe(100);
    expect(useGameStore.getState().state.lifestyleOwned.designer_suit).toBeUndefined();
  });

  it('fails for an unknown item id', () => {
    const result = useGameStore.getState().buyLifestyleItem('nope');
    expect(result.ok).toBe(false);
  });
});

describe('gameStore.doActivity', () => {
  beforeEach(() => {
    useGameStore.setState({
      state: createInitialState(),
      isLoaded: true,
      activeUid: 'test-uid',
      notifications: [],
      offlineSummary: null,
    });
  });

  it('spends cash, raises education, earns XP, and tracks the completion', () => {
    const result = useGameStore.getState().doActivity('business_book');

    expect(result.ok).toBe(true);
    const state = useGameStore.getState().state;
    expect(state.cash).toBe(10_000 - 10);
    expect(state.education).toBe(1);
    expect(state.xp).toBe(activityXpReward(getActivity('business_book')!));
    expect(state.totalEducationSpend).toBe(10);
    expect(state.activitiesCompleted.business_book).toBe(1);
  });

  it('accumulates completions and spend across repeats', () => {
    useGameStore.getState().doActivity('business_book');
    useGameStore.getState().doActivity('business_book');

    const state = useGameStore.getState().state;
    expect(state.activitiesCompleted.business_book).toBe(2);
    expect(state.totalEducationSpend).toBe(20);
    expect(state.education).toBe(2);
  });

  it('caps education at 100', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 1_000_000, education: 99 } }));
    useGameStore.getState().doActivity('executive_mba'); // educationBoost 20
    expect(useGameStore.getState().state.education).toBe(100);
  });

  it('fails without touching state when cash is insufficient', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, cash: 5 } }));
    const result = useGameStore.getState().doActivity('business_book');
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().state.cash).toBe(5);
    expect(useGameStore.getState().state.education).toBe(0);
  });

  it('fails for an unknown activity id', () => {
    const result = useGameStore.getState().doActivity('nope');
    expect(result.ok).toBe(false);
  });

  it('spends XP instead of cash for a recreation activity', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, xp: 100 } }));
    const result = useGameStore.getState().doActivity('go_for_a_run');

    expect(result.ok).toBe(true);
    const state = useGameStore.getState().state;
    expect(state.xp).toBe(100 - 15);
    expect(state.cash).toBe(10_000);
    expect(state.education).toBe(1);
    expect(state.totalEducationSpend).toBe(0);
    expect(state.activitiesCompleted.go_for_a_run).toBe(1);
  });

  it('fails without touching state when XP is insufficient', () => {
    useGameStore.setState((s) => ({ state: { ...s.state, xp: 5 } }));
    const result = useGameStore.getState().doActivity('go_for_a_run');
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().state.xp).toBe(5);
    expect(useGameStore.getState().state.education).toBe(0);
  });

  it('recomputes level immediately when spending XP drops the player below a level threshold', () => {
    const xpForLevel2 = xpForNextLevel(1);
    useGameStore.setState((s) => ({ state: { ...s.state, xp: xpForLevel2, level: 2 } }));

    useGameStore.getState().doActivity('esports_tournament'); // costs 200 xp

    const state = useGameStore.getState().state;
    expect(state.xp).toBe(xpForLevel2 - 200);
    expect(state.level).toBe(levelProgressFromXp(state.xp).level);
    expect(state.level).toBe(1);
  });
});
