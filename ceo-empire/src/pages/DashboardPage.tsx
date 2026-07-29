import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  BadgeCheck,
  Star,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Flame,
} from 'lucide-react';
import { useGameStore, selectNetWorth } from '@/store/gameStore';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { ActiveEventsBanner } from '@/components/dashboard/ActiveEventsBanner';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { formatMoney, formatPercent } from '@/lib/format';
import { computeEmpireTotals, businessFinancials, prestigeMultiplier } from '@/lib/gameEngine';
import { levelProgressFromXp } from '@/data/levels';
import { getBusinessTemplate } from '@/data/businesses';

export default function DashboardPage() {
  const state = useGameStore((s) => s.state);
  const { user } = useAuth();
  const netWorth = selectNetWorth(state);
  const totals = computeEmpireTotals(state);
  const progress = levelProgressFromXp(state.xp);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome back, <span className="gold-text">{user?.displayName}</span>
          </h1>
          <p className="text-sm text-white/40">Day {state.day} of your empire &middot; Here's where things stand.</p>
        </div>
        {state.prestige.count > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300">
            <Flame className="h-3.5 w-3.5" />
            Prestige {state.prestige.count} &middot; +{formatPercent(prestigeMultiplier(state) - 1)} income
          </div>
        )}
      </div>

      <ActiveEventsBanner events={state.activeEvents} day={state.day} />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-lg font-bold text-[#05070d]">
              {state.level}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Level {state.level} CEO</p>
              <p className="text-xs text-white/40">
                {progress.currentLevelXp.toLocaleString()} / {progress.xpToNextLevel.toLocaleString()} XP to next level
              </p>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar value={progress.currentLevelXp} max={progress.xpToNextLevel} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Current Cash"
          value={formatMoney(state.cash, { compact: true })}
          accent="emerald"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Net Worth"
          value={formatMoney(netWorth, { compact: true })}
          accent="gold"
        />
        <StatCard
          icon={<BadgeCheck className="h-5 w-5" />}
          label="Company Level"
          value={String(state.level)}
          sub={`${state.businesses.length} businesses owned`}
          accent="navy"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Business Reputation"
          value={`${Math.round(state.reputation)}/100`}
          accent="white"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Employees"
          value={String(state.employees.length)}
          accent="navy"
        />
        <StatCard
          icon={<ArrowUpRight className="h-5 w-5" />}
          label="Daily Profit"
          value={formatMoney(totals.dailyProfit, { compact: true })}
          accent={totals.dailyProfit >= 0 ? 'emerald' : 'red'}
        />
        <StatCard
          icon={<ArrowDownRight className="h-5 w-5" />}
          label="Daily Expenses"
          value={formatMoney(totals.dailyExpense, { compact: true })}
          accent="red"
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Daily Income"
          value={formatMoney(totals.dailyIncome, { compact: true })}
          accent="gold"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Net Worth History</h2>
          </div>
          <NetWorthChart data={state.netWorthHistory} />
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Your Businesses</h2>
            <Link to="/businesses" className="text-xs text-gold-400 hover:text-gold-300">
              View all
            </Link>
          </div>
          {state.businesses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-white/40">You don't own any businesses yet.</p>
              <Link
                to="/businesses"
                className="rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 px-4 py-2 text-xs font-semibold text-[#05070d]"
              >
                Buy your first business
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
              {state.businesses.map((b) => {
                const template = getBusinessTemplate(b.templateId);
                if (!template) return null;
                const fin = businessFinancials(b, state.employees, state.activeEvents);
                return (
                  <div
                    key={b.instanceId}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
                      <Icon name={template.icon} className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{template.name}</p>
                      <p className="text-[11px] text-white/40">{formatMoney(fin.dailyProfit, { compact: true })}/day</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
