export interface GamificationProfile {
  userId: string;
  xp: number;
  level: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: string;
}

export interface XpEvent {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

/** XP required to reach a given level (simple quadratic curve). */
export function xpForLevel(level: number): number {
  return 50 * level * level;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}
