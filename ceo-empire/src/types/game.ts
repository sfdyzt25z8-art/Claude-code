// Core domain types for CEO Empire.
// String-literal unions are used instead of enums (tsconfig has erasableSyntaxOnly).

export type BusinessCategory =
  | 'food'
  | 'retail'
  | 'tech'
  | 'transport'
  | 'manufacturing';

export type UpgradeType =
  | 'equipment'
  | 'marketing'
  | 'staff'
  | 'technology'
  | 'buildings';

export const UPGRADE_TYPES: UpgradeType[] = [
  'equipment',
  'marketing',
  'staff',
  'technology',
  'buildings',
];

export const MAX_UPGRADE_LEVEL = 5;

export interface BusinessTemplate {
  id: string;
  name: string;
  category: BusinessCategory;
  icon: string;
  description: string;
  baseCost: number;
  baseDailyIncome: number;
  baseDailyExpense: number;
  baseEmployeeCapacity: number;
  unlockLevel: number;
}

export interface OwnedBusiness {
  instanceId: string;
  templateId: string;
  purchasedAt: number;
  upgrades: Record<UpgradeType, number>;
  employeeIds: string[];
}

export type EmployeeType =
  | 'cashier'
  | 'manager'
  | 'accountant'
  | 'developer'
  | 'marketing_specialist';

export interface EmployeeTemplate {
  type: EmployeeType;
  name: string;
  icon: string;
  description: string;
  baseHireCost: number;
  baseDailySalary: number;
  /** Multiplier applied to a business's daily income when assigned. */
  incomeBoost: number;
  /** Multiplier applied to a business's daily expense when assigned (reductions are < 1). */
  expenseReduction: number;
  unlockLevel: number;
  suitedCategories: BusinessCategory[];
}

export interface Employee {
  id: string;
  type: EmployeeType;
  name: string;
  hiredAt: number;
  assignedBusinessId: string | null;
  dailySalary: number;
}

export type InvestmentCategory = 'stock' | 'real_estate' | 'crypto' | 'startup';

export interface InvestmentAsset {
  id: string;
  name: string;
  symbol: string;
  category: InvestmentCategory;
  basePrice: number;
  /** Standard deviation of per-tick % price change. */
  volatility: number;
  /** Long-run per-day drift, e.g. 0.01 = +1%/day on average. */
  drift: number;
  icon: string;
  unlockLevel: number;
}

export interface InvestmentHolding {
  assetId: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface PriceHistoryPoint {
  t: number;
  price: number;
}

export type EventEffectTarget = 'all_income' | 'all_expenses' | 'cash' | 'reputation' | 'market';

export interface GameEventTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  kind: 'positive' | 'negative' | 'neutral';
  target: EventEffectTarget;
  /** Multiplier for income/expenses/market effects, or flat delta for cash/reputation. */
  value: number;
  durationDays: number;
  weight: number;
}

export interface ActiveEvent {
  id: string;
  templateId: string;
  startedOnDay: number;
  endsOnDay: number;
}

export interface AchievementTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface NetWorthPoint {
  day: number;
  t: number;
  netWorth: number;
  cash: number;
}

export interface GameSettings {
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface DailyRewardState {
  lastClaimedAt: number | null;
  streak: number;
}

export interface GameState {
  cash: number;
  coins: number;
  totalIncomeEarned: number;
  totalExpensesPaid: number;
  reputation: number;
  xp: number;
  level: number;
  day: number;
  gameStartedAt: number;
  businesses: OwnedBusiness[];
  employees: Employee[];
  investments: InvestmentHolding[];
  marketPrices: Record<string, number>;
  priceHistory: Record<string, PriceHistoryPoint[]>;
  achievementsUnlocked: string[];
  activeEvents: ActiveEvent[];
  eventLog: { id: string; templateId: string; day: number; t: number }[];
  netWorthHistory: NetWorthPoint[];
  lastTickAt: number;
  lastSavedAt: number;
  dailyReward: DailyRewardState;
  settings: GameSettings;
}

export interface PlayerProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL?: string | null;
  createdAt: number;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  netWorth: number;
  level: number;
  businessCount: number;
  updatedAt: number;
}
