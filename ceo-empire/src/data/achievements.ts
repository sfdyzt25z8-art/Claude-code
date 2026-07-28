import type { AchievementTemplate, GameState } from '@/types/game';
import { BUSINESS_TEMPLATES } from './businesses';

export interface AchievementDefinition extends AchievementTemplate {
  check: (state: GameState, netWorth: number) => boolean;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_business',
    title: 'First Business',
    description: 'Purchase your very first business.',
    icon: 'Store',
    xpReward: 50,
    check: (s) => s.businesses.length >= 1,
  },
  {
    id: 'first_hire',
    title: 'First Hire',
    description: 'Hire your first employee.',
    icon: 'UserPlus',
    xpReward: 40,
    check: (s) => s.employees.length >= 1,
  },
  {
    id: 'first_upgrade',
    title: 'Leveling Up',
    description: 'Purchase your first business upgrade.',
    icon: 'ArrowUpCircle',
    xpReward: 40,
    check: (s) => s.businesses.some((b) => Object.values(b.upgrades).some((lvl) => lvl > 0)),
  },
  {
    id: 'first_investment',
    title: 'Market Player',
    description: 'Make your first investment.',
    icon: 'LineChart',
    xpReward: 60,
    check: (s) => s.investments.some((i) => i.quantity > 0),
  },
  {
    id: 'net_worth_100k',
    title: 'First $100,000',
    description: 'Reach a net worth of $100,000.',
    icon: 'DollarSign',
    xpReward: 150,
    check: (_s, netWorth) => netWorth >= 100_000,
  },
  {
    id: 'net_worth_1m',
    title: 'First $1 Million',
    description: 'Reach a net worth of $1,000,000.',
    icon: 'Gem',
    xpReward: 400,
    check: (_s, netWorth) => netWorth >= 1_000_000,
  },
  {
    id: 'net_worth_10m',
    title: 'Mogul',
    description: 'Reach a net worth of $10,000,000.',
    icon: 'Crown',
    xpReward: 900,
    check: (_s, netWorth) => netWorth >= 10_000_000,
  },
  {
    id: 'net_worth_100m',
    title: 'Titan of Industry',
    description: 'Reach a net worth of $100,000,000.',
    icon: 'Landmark',
    xpReward: 2000,
    check: (_s, netWorth) => netWorth >= 100_000_000,
  },
  {
    id: 'net_worth_1b',
    title: 'CEO Legend',
    description: 'Reach a net worth of $1,000,000,000.',
    icon: 'Trophy',
    xpReward: 5000,
    check: (_s, netWorth) => netWorth >= 1_000_000_000,
  },
  {
    id: 'employees_25',
    title: 'Growing Team',
    description: 'Employ 25 people across your empire.',
    icon: 'Users',
    xpReward: 250,
    check: (s) => s.employees.length >= 25,
  },
  {
    id: 'employees_100',
    title: '100 Employees',
    description: 'Employ 100 people across your empire.',
    icon: 'Users2',
    xpReward: 800,
    check: (s) => s.employees.length >= 100,
  },
  {
    id: 'business_master',
    title: 'Business Master',
    description: 'Own every type of business.',
    icon: 'Building',
    xpReward: 1200,
    check: (s) => {
      const owned = new Set(s.businesses.map((b) => b.templateId));
      return BUSINESS_TEMPLATES.every((t) => owned.has(t.id));
    },
  },
  {
    id: 'max_upgrade',
    title: 'Peak Performance',
    description: 'Max out every upgrade on a single business.',
    icon: 'Sparkles',
    xpReward: 500,
    check: (s) => s.businesses.some((b) => Object.values(b.upgrades).every((lvl) => lvl >= 5)),
  },
  {
    id: 'level_10',
    title: 'Seasoned Executive',
    description: 'Reach player level 10.',
    icon: 'BadgeCheck',
    xpReward: 600,
    check: (s) => s.level >= 10,
  },
];

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}
