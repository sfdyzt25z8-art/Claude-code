import { ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';
import type { BusinessTemplate, GameState, OwnedBusiness } from '@/types/game';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatMoney } from '@/lib/format';
import { businessFinancials, employeeCapacity, employeeCapacityUsed } from '@/lib/gameEngine';

interface BusinessCardProps {
  template: BusinessTemplate;
  owned: OwnedBusiness | null;
  state: GameState;
  onBuy: () => void;
  onManage: () => void;
}

export function BusinessCard({ template, owned, state, onBuy, onManage }: BusinessCardProps) {
  const affordable = state.cash >= template.baseCost;
  const fin = owned ? businessFinancials(owned, state.employees, state.activeEvents) : null;

  return (
    <Card className="relative flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
            <Icon name={template.icon} className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{template.name}</h3>
            <p className="text-[11px] uppercase tracking-wide text-white/30">{template.category}</p>
          </div>
        </div>
        {owned && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            Owned
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-white/40">{template.description}</p>

      {owned && fin ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" /> {formatMoney(fin.dailyIncome, { compact: true })}/sec
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <ArrowDownRight className="h-3.5 w-3.5" /> {formatMoney(fin.dailyExpense, { compact: true })}/sec
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-white/50">
            <Users className="h-3.5 w-3.5" /> {employeeCapacityUsed(owned)}/{employeeCapacity(owned)} staffed
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
          <div>Cost: <span className="font-medium text-white">{formatMoney(template.baseCost, { compact: true })}</span></div>
          <div>Income: <span className="font-medium text-emerald-400">{formatMoney(template.baseDailyIncome, { compact: true })}/sec</span></div>
        </div>
      )}

      {owned ? (
        <Button variant="secondary" onClick={onManage} className="w-full">
          Manage
        </Button>
      ) : (
        <Button onClick={onBuy} disabled={!affordable} className="w-full">
          {affordable ? `Buy for ${formatMoney(template.baseCost, { compact: true })}` : 'Not enough cash'}
        </Button>
      )}
    </Card>
  );
}
