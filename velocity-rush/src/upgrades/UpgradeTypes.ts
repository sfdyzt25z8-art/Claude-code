export type UpgradeCategory =
  | 'engine'
  | 'turbo'
  | 'tires'
  | 'suspension'
  | 'brakes'
  | 'nitrous'
  | 'transmission'
  | 'weightReduction'
  | 'aerodynamics';

export interface UpgradeEffect {
  topSpeed?: number;
  acceleration?: number;
  braking?: number;
  handling?: number;
  grip?: number;
  nitroPower?: number;
  weight?: number; // negative = lighter
}

export interface UpgradeTier {
  level: number; // 1-5
  cost: number;
  effect: UpgradeEffect;
}

export interface UpgradeCategoryDefinition {
  category: UpgradeCategory;
  label: string;
  description: string;
  icon: string;
  maxLevel: number;
  tiers: UpgradeTier[];
}

/** level per category, 0 = stock. Keyed by carId. */
export type CarUpgradeState = Record<UpgradeCategory, number>;
