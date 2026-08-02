import { useState } from 'react';
import type { EmployeeTemplate, GameState } from '@/types/game';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatMoney } from '@/lib/format';
import { getBusinessTemplate } from '@/data/businesses';
import { employeeCapacity, employeeCapacityUsed } from '@/lib/gameEngine';

export function HireCard({
  template,
  state,
  onHire,
}: {
  template: EmployeeTemplate;
  state: GameState;
  onHire: (businessId: string | null) => void;
}) {
  const [businessId, setBusinessId] = useState<string>('');
  const countOfType = state.employees.filter((e) => e.type === template.type).length;
  const cost = Math.round(template.baseHireCost * (1 + 0.12 * countOfType));
  const salary = Math.round(template.baseDailySalary * (1 + 0.08 * countOfType));
  const affordable = state.cash >= cost;

  const openBusinesses = state.businesses.filter(
    (b) => employeeCapacityUsed(b) < employeeCapacity(b),
  );

  return (
    <Card className="relative flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-700/40 text-navy-200">
          <Icon name={template.icon} className="h-5.5 w-5.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{template.name}</h3>
          <p className="text-[11px] text-white/30">{formatMoney(salary)}/sec salary</p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-white/40">{template.description}</p>

      {state.businesses.length > 0 && (
        <select
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-ink-900/70 px-3 py-2 text-xs text-white outline-none focus:border-gold-500/50"
        >
          <option value="">Unassigned</option>
          {openBusinesses.map((b) => {
            const t = getBusinessTemplate(b.templateId);
            return (
              <option key={b.instanceId} value={b.instanceId}>
                {t?.name} ({employeeCapacityUsed(b)}/{employeeCapacity(b)})
              </option>
            );
          })}
        </select>
      )}

      <Button
        onClick={() => onHire(businessId || null)}
        disabled={!affordable}
        className="w-full"
      >
        {affordable ? `Hire for ${formatMoney(cost)}` : 'Not enough cash'}
      </Button>
    </Card>
  );
}
