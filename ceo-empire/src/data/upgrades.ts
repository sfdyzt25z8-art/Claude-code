import type { UpgradeType } from '@/types/game';
import { MAX_UPGRADE_LEVEL } from '@/types/game';

export interface UpgradeDefinition {
  type: UpgradeType;
  label: string;
  icon: string;
  description: string;
  /** Fractional income increase applied per level (e.g. 0.08 = +8%). */
  incomePerLevel: number;
  /** Fractional expense change applied per level (negative = reduction). */
  expensePerLevel: number;
  /** Cost of each level as a multiple of the business's base cost. */
  costMultipliers: number[];
}

export const UPGRADE_DEFINITIONS: Record<UpgradeType, UpgradeDefinition> = {
  equipment: {
    type: 'equipment',
    label: 'Equipment',
    icon: 'Wrench',
    description: 'Better tools and machinery boost output.',
    incomePerLevel: 0.08,
    expensePerLevel: 0,
    costMultipliers: [0.3, 0.55, 0.95, 1.5, 2.3],
  },
  marketing: {
    type: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    description: 'Ad campaigns and branding attract more customers.',
    incomePerLevel: 0.1,
    expensePerLevel: 0.02,
    costMultipliers: [0.25, 0.5, 0.9, 1.4, 2.1],
  },
  staff: {
    type: 'staff',
    label: 'Staff Training',
    icon: 'Users',
    description: 'Well-trained staff work faster and waste less.',
    incomePerLevel: 0.06,
    expensePerLevel: -0.04,
    costMultipliers: [0.3, 0.6, 1.0, 1.6, 2.4],
  },
  technology: {
    type: 'technology',
    label: 'Technology',
    icon: 'Cpu',
    description: 'Automation and software cut costs and raise throughput.',
    incomePerLevel: 0.07,
    expensePerLevel: -0.05,
    costMultipliers: [0.35, 0.65, 1.1, 1.7, 2.6],
  },
  buildings: {
    type: 'buildings',
    label: 'Buildings',
    icon: 'Building2',
    description: 'Expanded facilities increase capacity and reach.',
    incomePerLevel: 0.09,
    expensePerLevel: 0.01,
    costMultipliers: [0.4, 0.75, 1.25, 1.9, 2.8],
  },
};

export function upgradeCost(type: UpgradeType, baseCost: number, currentLevel: number): number | null {
  if (currentLevel >= MAX_UPGRADE_LEVEL) return null;
  const def = UPGRADE_DEFINITIONS[type];
  const mult = def.costMultipliers[currentLevel];
  return Math.round(baseCost * mult);
}
