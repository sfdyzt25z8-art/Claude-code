import { describe, it, expect } from 'vitest';
import { createInitialState } from './gameEngine';
import { checkNewAchievements } from './achievementsEngine';
import { getAchievement } from '@/data/achievements';

describe('checkNewAchievements', () => {
  it('unlocks nothing for a brand-new game', () => {
    const state = createInitialState();
    const result = checkNewAchievements(state, state.cash);
    expect(result.newly).toEqual([]);
    expect(result.xpGained).toBe(0);
  });

  it('unlocks "first_business" once a business is owned, awarding its XP', () => {
    const state = createInitialState();
    state.businesses = [
      {
        instanceId: 'biz_1',
        templateId: 'lemonade_stand',
        purchasedAt: 0,
        upgrades: { equipment: 0, marketing: 0, staff: 0, technology: 0, buildings: 0 },
        employeeIds: [],
      },
    ];
    const result = checkNewAchievements(state, state.cash);
    expect(result.newly).toContain('first_business');
    expect(result.xpGained).toBe(getAchievement('first_business')!.xpReward);
  });

  it('does not re-award an achievement already in achievementsUnlocked', () => {
    const state = createInitialState();
    state.achievementsUnlocked = ['first_business'];
    state.businesses = [
      {
        instanceId: 'biz_1',
        templateId: 'lemonade_stand',
        purchasedAt: 0,
        upgrades: { equipment: 0, marketing: 0, staff: 0, technology: 0, buildings: 0 },
        employeeIds: [],
      },
    ];
    const result = checkNewAchievements(state, state.cash);
    expect(result.newly).not.toContain('first_business');
  });

  it('unlocks net worth milestones based on the passed-in net worth', () => {
    const state = createInitialState();
    const result = checkNewAchievements(state, 150_000);
    expect(result.newly).toContain('net_worth_100k');
    expect(result.newly).not.toContain('net_worth_1m');
  });

  it('can unlock multiple achievements in a single check and sum their XP', () => {
    const state = createInitialState();
    state.employees = Array.from({ length: 25 }, (_, i) => ({
      id: `emp_${i}`,
      type: 'cashier' as const,
      name: `Employee ${i}`,
      hiredAt: 0,
      assignedBusinessId: null,
      dailySalary: 60,
    }));
    const result = checkNewAchievements(state, 200_000);
    // 25 employees also satisfies "first_hire" (>=1 employee), so all three fire together.
    expect(result.newly).toEqual(
      expect.arrayContaining(['employees_25', 'net_worth_100k', 'first_hire']),
    );
    const expectedXp =
      getAchievement('employees_25')!.xpReward +
      getAchievement('net_worth_100k')!.xpReward +
      getAchievement('first_hire')!.xpReward;
    expect(result.xpGained).toBe(expectedXp);
  });
});
