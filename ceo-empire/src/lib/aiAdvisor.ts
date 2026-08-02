import type { GameState, UpgradeType } from '@/types/game';
import { UPGRADE_TYPES } from '@/types/game';
import { BUSINESS_TEMPLATES, getBusinessTemplate } from '@/data/businesses';
import { UPGRADE_DEFINITIONS, upgradeCost } from '@/data/upgrades';
import { computeEmpireTotals, computeNetWorth, businessFinancials, employeeCapacity, employeeCapacityUsed } from '@/lib/gameEngine';
import { formatMoney } from '@/lib/format';

export interface AdviceItem {
  id: string;
  icon: string;
  title: string;
  detail: string;
  tone: 'tip' | 'opportunity' | 'warning' | 'summary';
}

export function generateAdvice(state: GameState): AdviceItem[] {
  const items: AdviceItem[] = [];
  const netWorth = computeNetWorth(state);
  const totals = computeEmpireTotals(state);
  const ownedIds = new Set(state.businesses.map((b) => b.templateId));

  if (state.businesses.length === 0) {
    items.push({
      id: 'first_business',
      icon: 'Rocket',
      title: 'Buy your first business',
      detail:
        'The Lemonade Stand costs just $500 and starts paying you back immediately. Every empire starts small — get your first business running today.',
      tone: 'tip',
    });
  } else {
    const nextAffordable = BUSINESS_TEMPLATES.filter(
      (t) => !ownedIds.has(t.id),
    ).sort((a, b) => a.baseCost - b.baseCost)[0];
    if (nextAffordable) {
      const canAfford = state.cash >= nextAffordable.baseCost;
      items.push({
        id: 'recommend_business',
        icon: 'Building2',
        title: canAfford
          ? `Buy a ${nextAffordable.name}`
          : `Save up for a ${nextAffordable.name}`,
        detail: canAfford
          ? `You can afford it now for ${formatMoney(nextAffordable.baseCost)}. It should bring in roughly ${formatMoney(nextAffordable.baseDailyIncome - nextAffordable.baseDailyExpense)}/day in profit.`
          : `It costs ${formatMoney(nextAffordable.baseCost)} — you need ${formatMoney(nextAffordable.baseCost - state.cash)} more. Keep growing your current businesses.`,
        tone: 'opportunity',
      });
    }
  }

  // Best-ROI upgrade across all owned businesses.
  let bestUpgrade: { businessName: string; type: UpgradeType; cost: number; roi: number } | null = null;
  for (const business of state.businesses) {
    const template = getBusinessTemplate(business.templateId);
    if (!template) continue;
    for (const type of UPGRADE_TYPES) {
      const level = business.upgrades[type] ?? 0;
      const cost = upgradeCost(type, template.baseCost, level);
      if (cost === null || cost > state.cash * 3) continue;
      const def = UPGRADE_DEFINITIONS[type];
      const gain = template.baseDailyIncome * def.incomePerLevel;
      const roi = gain / cost;
      if (!bestUpgrade || roi > bestUpgrade.roi) {
        bestUpgrade = { businessName: template.name, type, cost, roi };
      }
    }
  }
  if (bestUpgrade) {
    const def = UPGRADE_DEFINITIONS[bestUpgrade.type];
    items.push({
      id: 'recommend_upgrade',
      icon: def.icon,
      title: `Upgrade ${def.label} at your ${bestUpgrade.businessName}`,
      detail:
        state.cash >= bestUpgrade.cost
          ? `This is your best return on investment right now — costs ${formatMoney(bestUpgrade.cost)} and pays for itself fast.`
          : `Best long-term ROI, but you'll need ${formatMoney(bestUpgrade.cost)} to afford it.`,
      tone: 'opportunity',
    });
  }

  // Understaffed business tip.
  const understaffed = state.businesses.find(
    (b) => employeeCapacityUsed(b) < employeeCapacity(b),
  );
  if (understaffed) {
    const template = getBusinessTemplate(understaffed.templateId);
    if (template) {
      items.push({
        id: 'hire_tip',
        icon: 'Users',
        title: `Hire staff for your ${template.name}`,
        detail: `It has ${employeeCapacity(understaffed) - employeeCapacityUsed(understaffed)} open employee slot(s). Employees boost income and can cut costs — a great next move.`,
        tone: 'tip',
      });
    }
  }

  // Idle cash tip.
  if (state.cash > 5000 && state.businesses.length > 0) {
    items.push({
      id: 'idle_cash',
      icon: 'LineChart',
      title: 'Put your idle cash to work',
      detail: `You're sitting on ${formatMoney(state.cash, { compact: true })}. Consider investing in stocks or real estate, or reinvesting in upgrades — cash sitting still earns you nothing.`,
      tone: 'tip',
    });
  }

  // Negative profit warning.
  if (totals.dailyProfit < 0 && state.businesses.length > 0) {
    items.push({
      id: 'negative_profit',
      icon: 'AlertTriangle',
      title: "You're losing money every day",
      detail: `Expenses (${formatMoney(totals.dailyExpense, { compact: true })}/day) exceed income (${formatMoney(totals.dailyIncome, { compact: true })}/day). Consider firing underused employees or upgrading Technology to cut costs.`,
      tone: 'warning',
    });
  }

  // Profit explainer, always included.
  items.push({
    id: 'explain_profit',
    icon: 'Calculator',
    title: 'Your daily profit, explained',
    detail: `Income ${formatMoney(totals.dailyIncome, { compact: true })} − Expenses ${formatMoney(totals.dailyExpense, { compact: true })} = Profit ${formatMoney(totals.dailyProfit, { compact: true })}/day. Net worth: ${formatMoney(netWorth, { compact: true })}.`,
    tone: 'summary',
  });

  return items.slice(0, 6);
}

export function businessProfitExplainer(state: GameState, businessId: string): string | null {
  const business = state.businesses.find((b) => b.instanceId === businessId);
  if (!business) return null;
  const template = getBusinessTemplate(business.templateId);
  if (!template) return null;
  const fin = businessFinancials(business, state.employees, state.activeEvents);
  return `${template.name} earns ${formatMoney(fin.dailyIncome, { compact: true })}/day and costs ${formatMoney(fin.dailyExpense, { compact: true })}/day to run, for a profit of ${formatMoney(fin.dailyProfit, { compact: true })}/day.`;
}
