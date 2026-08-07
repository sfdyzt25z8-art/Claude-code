import type { UpgradeCategory, UpgradeCategoryDefinition, UpgradeEffect, UpgradeTier } from './UpgradeTypes';

const TIER_COUNT = 5;

/** Generates 5 tiers with linearly-scaling cost and effect from a per-level increment. */
function buildTiers(baseCost: number, costGrowth: number, perLevelEffect: UpgradeEffect): UpgradeTier[] {
  const tiers: UpgradeTier[] = [];
  for (let level = 1; level <= TIER_COUNT; level++) {
    const effect: UpgradeEffect = {};
    for (const [key, value] of Object.entries(perLevelEffect) as [keyof UpgradeEffect, number][]) {
      effect[key] = Math.round(value * level * 10) / 10;
    }
    tiers.push({ level, cost: Math.round(baseCost * Math.pow(costGrowth, level - 1)), effect });
  }
  return tiers;
}

interface CategorySeed {
  category: UpgradeCategory;
  label: string;
  description: string;
  icon: string;
  baseCost: number;
  perLevelEffect: UpgradeEffect;
}

const SEEDS: CategorySeed[] = [
  {
    category: 'engine',
    label: 'Engine',
    description: 'Bores, cams, and ECU tuning for more horsepower and stronger pull.',
    icon: 'engine',
    baseCost: 1200,
    perLevelEffect: { topSpeed: 2.4, acceleration: 2.8 },
  },
  {
    category: 'turbo',
    label: 'Turbocharger',
    description: 'Bigger turbo, less lag, more top-end power.',
    icon: 'turbo',
    baseCost: 1500,
    perLevelEffect: { topSpeed: 3.0, acceleration: 1.4 },
  },
  {
    category: 'tires',
    label: 'Tires',
    description: 'Stickier compounds for more mechanical grip in every corner.',
    icon: 'tires',
    baseCost: 900,
    perLevelEffect: { grip: 3.2, handling: 0.8 },
  },
  {
    category: 'suspension',
    label: 'Suspension',
    description: 'Adjustable coilovers sharpen turn-in and stabilise landings.',
    icon: 'suspension',
    baseCost: 1000,
    perLevelEffect: { handling: 2.6, grip: 1.0 },
  },
  {
    category: 'brakes',
    label: 'Brakes',
    description: 'Bigger rotors and performance pads for shorter stopping distances.',
    icon: 'brakes',
    baseCost: 800,
    perLevelEffect: { braking: 3.4 },
  },
  {
    category: 'nitrous',
    label: 'Nitrous',
    description: 'Larger bottle and refined jets for a stronger, longer nitro boost.',
    icon: 'nitrous',
    baseCost: 1300,
    perLevelEffect: { nitroPower: 3.6 },
  },
  {
    category: 'transmission',
    label: 'Transmission',
    description: 'Closer gear ratios keep the engine in its power band longer.',
    icon: 'transmission',
    baseCost: 1100,
    perLevelEffect: { acceleration: 2.2, topSpeed: 1.0 },
  },
  {
    category: 'weightReduction',
    label: 'Weight Reduction',
    description: 'Carbon panels and a stripped interior shave off precious kilograms.',
    icon: 'weight',
    baseCost: 1600,
    perLevelEffect: { weight: -2.8, handling: 1.0 },
  },
  {
    category: 'aerodynamics',
    label: 'Aerodynamics',
    description: 'Splitters, diffusers, and wings add downforce for high-speed stability.',
    icon: 'aero',
    baseCost: 1400,
    perLevelEffect: { handling: 1.6, grip: 1.4, topSpeed: -0.4 },
  },
];

export const UPGRADE_DATA: UpgradeCategoryDefinition[] = SEEDS.map((seed) => ({
  category: seed.category,
  label: seed.label,
  description: seed.description,
  icon: seed.icon,
  maxLevel: TIER_COUNT,
  tiers: buildTiers(seed.baseCost, 1.35, seed.perLevelEffect),
}));

export function getUpgradeDefinition(category: UpgradeCategory): UpgradeCategoryDefinition {
  const def = UPGRADE_DATA.find((u) => u.category === category);
  if (!def) throw new Error(`Unknown upgrade category: ${category}`);
  return def;
}

export function createStockUpgradeState(): Record<UpgradeCategory, number> {
  const state = {} as Record<UpgradeCategory, number>;
  for (const seed of SEEDS) state[seed.category] = 0;
  return state;
}
