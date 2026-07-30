import { describe, it, expect } from 'vitest';
import { xpForNextLevel, levelProgressFromXp } from './levels';

describe('xpForNextLevel', () => {
  it('increases as level increases', () => {
    expect(xpForNextLevel(2)).toBeGreaterThan(xpForNextLevel(1));
    expect(xpForNextLevel(10)).toBeGreaterThan(xpForNextLevel(5));
  });
});

describe('levelProgressFromXp', () => {
  it('starts at level 1 with 0 XP', () => {
    const progress = levelProgressFromXp(0);
    expect(progress.level).toBe(1);
    expect(progress.currentLevelXp).toBe(0);
    expect(progress.totalXp).toBe(0);
  });

  it('stays at level 1 until enough XP accrues', () => {
    const threshold = xpForNextLevel(1);
    const progress = levelProgressFromXp(threshold - 1);
    expect(progress.level).toBe(1);
    expect(progress.currentLevelXp).toBe(threshold - 1);
  });

  it('advances to level 2 exactly at the threshold', () => {
    const threshold = xpForNextLevel(1);
    const progress = levelProgressFromXp(threshold);
    expect(progress.level).toBe(2);
    expect(progress.currentLevelXp).toBe(0);
  });

  it('carries remaining XP across multiple level-ups', () => {
    const l1 = xpForNextLevel(1);
    const l2 = xpForNextLevel(2);
    const progress = levelProgressFromXp(l1 + l2 + 5);
    expect(progress.level).toBe(3);
    expect(progress.currentLevelXp).toBe(5);
  });

  it('never reports a negative currentLevelXp', () => {
    for (const xp of [0, 100, 5000, 50000, 500000]) {
      const progress = levelProgressFromXp(xp);
      expect(progress.currentLevelXp).toBeGreaterThanOrEqual(0);
      expect(progress.currentLevelXp).toBeLessThan(progress.xpToNextLevel);
    }
  });
});
