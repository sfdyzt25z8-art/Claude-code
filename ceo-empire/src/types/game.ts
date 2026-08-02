// Core domain types for CEO Empire.
// String-literal unions are used instead of enums (tsconfig has erasableSyntaxOnly).

export type BusinessCategory =
  | 'food'
  | 'retail'
  | 'tech'
  | 'transport'
  | 'manufacturing'
  | 'finance';

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
export const MAX_EMPLOYEE_SKILL_LEVEL = 5;

export interface BusinessTemplate {
  id: string;
  name: string;
  category: BusinessCategory;
  icon: string;
  description: string;
  baseCost: number;
  baseHourlyIncome: number;
  baseHourlyExpense: number;
  baseEmployeeCapacity: number;
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
  | 'marketing_specialist'
  | 'sales_rep'
  | 'hr_specialist'
  | 'operations_manager'
  | 'data_analyst'
  | 'executive_coo'
  | 'security_guard'
  | 'barista'
  | 'logistics_coordinator'
  | 'product_designer'
  | 'legal_counsel'
  | 'investment_banker'
  | 'chief_technology_officer'
  | 'brand_ambassador';

export interface EmployeeTemplate {
  type: EmployeeType;
  name: string;
  icon: string;
  description: string;
  baseHireCost: number;
  baseHourlySalary: number;
  /** Multiplier applied to a business's hourly income when assigned. */
  incomeBoost: number;
  /** Multiplier applied to a business's hourly expense when assigned (reductions are < 1). */
  expenseReduction: number;
  suitedCategories: BusinessCategory[];
}

export interface Employee {
  id: string;
  type: EmployeeType;
  name: string;
  hiredAt: number;
  assignedBusinessId: string | null;
  hourlySalary: number;
  /** Training level (0-MAX_EMPLOYEE_SKILL_LEVEL) — boosts their income/expense contribution. */
  skillLevel: number;
}

export type InvestmentCategory =
  | 'stock'
  | 'real_estate'
  | 'crypto'
  | 'startup'
  | 'commodity'
  | 'business';

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

export interface PrestigeState {
  count: number;
}

export type LifestyleCategory = 'clothing' | 'accessories' | 'jewelry' | 'land' | 'vehicles' | 'collectibles';

export interface LifestyleItem {
  id: string;
  name: string;
  category: LifestyleCategory;
  icon: string;
  description: string;
  cost: number;
  /** Reputation gained (0-100 scale, capped) each time this item is bought. */
  reputationBoost: number;
}

export type ActivityCategory = 'reading' | 'classes' | 'college' | 'recreation';

export type ActivityCostType = 'cash' | 'xp';

export interface ActivityItem {
  id: string;
  name: string;
  category: ActivityCategory;
  icon: string;
  description: string;
  cost: number;
  /** Which resource `cost` is paid from — dollars for reading/classes/college, XP for recreation. */
  costType: ActivityCostType;
  /** Education gained (0-100 scale, capped) each time this activity is done. */
  educationBoost: number;
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
  prestige: PrestigeState;
  settings: GameSettings;
  /** Cumulative cash spent on lifestyle/shopping purchases. */
  totalLifestyleSpend: number;
  /** Lifestyle item id -> number of times purchased. */
  lifestyleOwned: Record<string, number>;
  /** Education level (0-100, capped) — grants a small global income multiplier. */
  education: number;
  /** Cumulative cash spent on learning activities. */
  totalEducationSpend: number;
  /** Activity id -> number of times completed. */
  activitiesCompleted: Record<string, number>;
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
