import { create } from 'zustand';
import type {
  Employee,
  EmployeeType,
  GameSettings,
  GameState,
  OwnedBusiness,
  UpgradeType,
} from '@/types/game';
import { getBusinessTemplate } from '@/data/businesses';
import { upgradeCost } from '@/data/upgrades';
import { EMPLOYEE_TEMPLATES, randomEmployeeName } from '@/data/employees';
import { getInvestmentAsset } from '@/data/investments';
import { getEventTemplate } from '@/data/events';
import { getAchievement } from '@/data/achievements';
import {
  createInitialState,
  employeeCapacity,
  employeeCapacityUsed,
  computeNetWorth,
  prestigeReset,
  hydrateState,
  PRESTIGE_MIN_NET_WORTH,
} from '@/lib/gameEngine';
import { advanceTime, MAX_OFFLINE_SECONDS } from '@/lib/gameTick';
import { formatMoney } from '@/lib/format';

export interface GameNotification {
  id: string;
  kind: 'event' | 'achievement' | 'level_up' | 'info' | 'error';
  title: string;
  message: string;
  icon: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface OfflineSummary {
  elapsedSeconds: number;
  cashGained: number;
}

interface GameStoreState {
  state: GameState;
  isLoaded: boolean;
  activeUid: string | null;
  notifications: GameNotification[];
  offlineSummary: OfflineSummary | null;

  loadForUser: (uid: string, initial: GameState) => void;
  tick: (dtSeconds: number) => void;
  buyBusiness: (templateId: string) => ActionResult;
  upgradeBusiness: (instanceId: string, type: UpgradeType) => ActionResult;
  hireEmployee: (type: EmployeeType, businessId?: string | null) => ActionResult;
  assignEmployee: (employeeId: string, businessId: string | null) => ActionResult;
  fireEmployee: (employeeId: string) => void;
  buyInvestment: (assetId: string, dollarAmount: number) => ActionResult;
  sellInvestment: (assetId: string, quantity: number) => ActionResult;
  claimDailyReward: () => ActionResult & {
    reward?: { cash: number; coins: number; xp: number; streak: number };
  };
  updateSettings: (partial: Partial<GameSettings>) => void;
  resetGame: () => void;
  prestige: () => ActionResult;
  dismissNotification: (id: string) => void;
  clearOfflineSummary: () => void;
}

function notifId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  state: createInitialState(),
  isLoaded: false,
  activeUid: null,
  notifications: [],
  offlineSummary: null,

  loadForUser: (uid, rawInitial) => {
    const initial = hydrateState(rawInitial);
    const now = Date.now();
    const elapsedSeconds = Math.min((now - initial.lastTickAt) / 1000, MAX_OFFLINE_SECONDS);
    let nextState = initial;
    let offlineSummary: OfflineSummary | null = null;

    if (elapsedSeconds > 5) {
      const cashBefore = initial.cash;
      const result = advanceTime(initial, elapsedSeconds, now);
      nextState = result.state;
      offlineSummary = { elapsedSeconds, cashGained: nextState.cash - cashBefore };
    } else {
      nextState = { ...initial, lastTickAt: now };
    }

    set({ state: nextState, isLoaded: true, activeUid: uid, offlineSummary, notifications: [] });
  },

  tick: (dtSeconds) => {
    const { state } = get();
    const now = Date.now();
    const result = advanceTime(state, dtSeconds, now);

    const newNotifications: GameNotification[] = [];
    for (const evt of result.triggeredEvents) {
      const tpl = getEventTemplate(evt.templateId);
      if (tpl) {
        newNotifications.push({
          id: notifId(),
          kind: 'event',
          title: tpl.title,
          message: tpl.description,
          icon: tpl.icon,
        });
      }
    }
    for (const achId of result.newAchievements) {
      const def = getAchievement(achId);
      if (def) {
        newNotifications.push({
          id: notifId(),
          kind: 'achievement',
          title: `Achievement unlocked: ${def.title}`,
          message: `${def.description} (+${def.xpReward} XP)`,
          icon: def.icon,
        });
      }
    }
    if (result.leveledUp) {
      newNotifications.push({
        id: notifId(),
        kind: 'level_up',
        title: `Level up! You're now level ${result.state.level}`,
        message: 'New businesses and upgrades may have unlocked.',
        icon: 'PartyPopper',
      });
    }

    set((s) => ({
      state: result.state,
      notifications: newNotifications.length ? [...s.notifications, ...newNotifications] : s.notifications,
    }));
  },

  buyBusiness: (templateId) => {
    const { state } = get();
    const template = getBusinessTemplate(templateId);
    if (!template) return { ok: false, error: 'Unknown business.' };
    if (state.businesses.some((b) => b.templateId === templateId)) {
      return { ok: false, error: 'You already own this business.' };
    }
    if (state.level < template.unlockLevel) {
      return { ok: false, error: `Reach level ${template.unlockLevel} to unlock this business.` };
    }
    if (state.cash < template.baseCost) {
      return { ok: false, error: 'Not enough cash.' };
    }
    const newBusiness: OwnedBusiness = {
      instanceId: `biz_${Math.random().toString(36).slice(2, 10)}`,
      templateId,
      purchasedAt: Date.now(),
      upgrades: { equipment: 0, marketing: 0, staff: 0, technology: 0, buildings: 0 },
      employeeIds: [],
    };
    set((s) => ({
      state: {
        ...s.state,
        cash: s.state.cash - template.baseCost,
        businesses: [...s.state.businesses, newBusiness],
        reputation: Math.min(100, s.state.reputation + 2),
      },
    }));
    return { ok: true };
  },

  upgradeBusiness: (instanceId, type) => {
    const { state } = get();
    const business = state.businesses.find((b) => b.instanceId === instanceId);
    if (!business) return { ok: false, error: 'Business not found.' };
    const template = getBusinessTemplate(business.templateId);
    if (!template) return { ok: false, error: 'Unknown business.' };
    const currentLevel = business.upgrades[type] ?? 0;
    const cost = upgradeCost(type, template.baseCost, currentLevel);
    if (cost === null) return { ok: false, error: 'Already at max level.' };
    if (state.cash < cost) return { ok: false, error: 'Not enough cash.' };

    set((s) => ({
      state: {
        ...s.state,
        cash: s.state.cash - cost,
        businesses: s.state.businesses.map((b) =>
          b.instanceId === instanceId
            ? { ...b, upgrades: { ...b.upgrades, [type]: currentLevel + 1 } }
            : b,
        ),
      },
    }));
    return { ok: true };
  },

  hireEmployee: (type, businessId) => {
    const { state } = get();
    const template = EMPLOYEE_TEMPLATES[type];
    if (state.level < template.unlockLevel) {
      return { ok: false, error: `Reach level ${template.unlockLevel} to hire this role.` };
    }
    const countOfType = state.employees.filter((e) => e.type === type).length;
    const cost = Math.round(template.baseHireCost * (1 + 0.12 * countOfType));
    const salary = Math.round(template.baseDailySalary * (1 + 0.08 * countOfType));
    if (state.cash < cost) return { ok: false, error: 'Not enough cash.' };

    let targetBusiness: OwnedBusiness | undefined;
    if (businessId) {
      targetBusiness = state.businesses.find((b) => b.instanceId === businessId);
      if (!targetBusiness) return { ok: false, error: 'Business not found.' };
      if (employeeCapacityUsed(targetBusiness) >= employeeCapacity(targetBusiness)) {
        return { ok: false, error: 'That business is at full employee capacity.' };
      }
    }

    const employee: Employee = {
      id: `emp_${Math.random().toString(36).slice(2, 10)}`,
      type,
      name: randomEmployeeName(),
      hiredAt: Date.now(),
      assignedBusinessId: businessId ?? null,
      dailySalary: salary,
    };

    set((s) => ({
      state: {
        ...s.state,
        cash: s.state.cash - cost,
        employees: [...s.state.employees, employee],
        businesses: businessId
          ? s.state.businesses.map((b) =>
              b.instanceId === businessId ? { ...b, employeeIds: [...b.employeeIds, employee.id] } : b,
            )
          : s.state.businesses,
      },
    }));
    return { ok: true };
  },

  assignEmployee: (employeeId, businessId) => {
    const { state } = get();
    const employee = state.employees.find((e) => e.id === employeeId);
    if (!employee) return { ok: false, error: 'Employee not found.' };
    if (employee.assignedBusinessId === businessId) return { ok: true };

    if (businessId) {
      const target = state.businesses.find((b) => b.instanceId === businessId);
      if (!target) return { ok: false, error: 'Business not found.' };
      if (employeeCapacityUsed(target) >= employeeCapacity(target)) {
        return { ok: false, error: 'That business is at full employee capacity.' };
      }
    }

    set((s) => ({
      state: {
        ...s.state,
        employees: s.state.employees.map((e) =>
          e.id === employeeId ? { ...e, assignedBusinessId: businessId } : e,
        ),
        businesses: s.state.businesses.map((b) => {
          if (b.instanceId === employee.assignedBusinessId) {
            return { ...b, employeeIds: b.employeeIds.filter((id) => id !== employeeId) };
          }
          if (b.instanceId === businessId) {
            return { ...b, employeeIds: [...b.employeeIds, employeeId] };
          }
          return b;
        }),
      },
    }));
    return { ok: true };
  },

  fireEmployee: (employeeId) => {
    set((s) => ({
      state: {
        ...s.state,
        employees: s.state.employees.filter((e) => e.id !== employeeId),
        businesses: s.state.businesses.map((b) => ({
          ...b,
          employeeIds: b.employeeIds.filter((id) => id !== employeeId),
        })),
      },
    }));
  },

  buyInvestment: (assetId, dollarAmount) => {
    const { state } = get();
    const asset = getInvestmentAsset(assetId);
    if (!asset) return { ok: false, error: 'Unknown asset.' };
    if (state.level < asset.unlockLevel) {
      return { ok: false, error: `Reach level ${asset.unlockLevel} to invest here.` };
    }
    if (dollarAmount <= 0 || state.cash < dollarAmount) {
      return { ok: false, error: 'Not enough cash.' };
    }
    const price = state.marketPrices[assetId] ?? asset.basePrice;
    const quantity = dollarAmount / price;

    set((s) => {
      const existing = s.state.investments.find((i) => i.assetId === assetId);
      let investments;
      if (existing) {
        const totalQty = existing.quantity + quantity;
        const avgBuyPrice = (existing.avgBuyPrice * existing.quantity + price * quantity) / totalQty;
        investments = s.state.investments.map((i) =>
          i.assetId === assetId ? { ...i, quantity: totalQty, avgBuyPrice } : i,
        );
      } else {
        investments = [...s.state.investments, { assetId, quantity, avgBuyPrice: price }];
      }
      return { state: { ...s.state, cash: s.state.cash - dollarAmount, investments } };
    });
    return { ok: true };
  },

  sellInvestment: (assetId, quantity) => {
    const { state } = get();
    const holding = state.investments.find((i) => i.assetId === assetId);
    if (!holding || holding.quantity < quantity || quantity <= 0) {
      return { ok: false, error: 'Not enough holdings to sell.' };
    }
    const price = state.marketPrices[assetId] ?? 0;
    const proceeds = price * quantity;

    set((s) => {
      const remaining = holding.quantity - quantity;
      const investments =
        remaining <= 0.0001
          ? s.state.investments.filter((i) => i.assetId !== assetId)
          : s.state.investments.map((i) => (i.assetId === assetId ? { ...i, quantity: remaining } : i));
      return { state: { ...s.state, cash: s.state.cash + proceeds, investments } };
    });
    return { ok: true };
  },

  claimDailyReward: () => {
    const { state } = get();
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    const graceMs = cooldownMs * 2;
    const last = state.dailyReward.lastClaimedAt;

    if (last !== null && now - last < cooldownMs) {
      return { ok: false, error: 'Come back later for your next reward.' };
    }

    const streak = last !== null && now - last < graceMs ? Math.min(state.dailyReward.streak + 1, 30) : 1;
    const reward = {
      cash: 500 + streak * 150,
      coins: 20 + streak * 5,
      xp: 30 + streak * 10,
      streak,
    };

    set((s) => ({
      state: {
        ...s.state,
        cash: s.state.cash + reward.cash,
        coins: s.state.coins + reward.coins,
        xp: s.state.xp + reward.xp,
        dailyReward: { lastClaimedAt: now, streak },
      },
    }));
    return { ok: true, reward };
  },

  updateSettings: (partial) => {
    set((s) => ({ state: { ...s.state, settings: { ...s.state.settings, ...partial } } }));
  },

  resetGame: () => {
    set({ state: createInitialState(), notifications: [], offlineSummary: null });
  },

  prestige: () => {
    const { state } = get();
    const netWorth = computeNetWorth(state);
    if (netWorth < PRESTIGE_MIN_NET_WORTH) {
      return {
        ok: false,
        error: `Reach a net worth of ${formatMoney(PRESTIGE_MIN_NET_WORTH, { compact: true })} to prestige.`,
      };
    }
    const nextState = prestigeReset(state);
    set((s) => ({
      state: nextState,
      notifications: [
        ...s.notifications,
        {
          id: notifId(),
          kind: 'level_up',
          title: `Prestiged! Now level ${nextState.prestige.count}`,
          message: `You've restarted with a permanent +${Math.round(nextState.prestige.count * 15)}% income boost.`,
          icon: 'Flame',
        },
      ],
    }));
    return { ok: true };
  },

  dismissNotification: (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  clearOfflineSummary: () => set({ offlineSummary: null }),
}));

export function selectNetWorth(state: GameState): number {
  return computeNetWorth(state);
}
