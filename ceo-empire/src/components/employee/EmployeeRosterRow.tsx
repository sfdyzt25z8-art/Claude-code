import { UserMinus, GraduationCap } from 'lucide-react';
import type { Employee, GameState } from '@/types/game';
import { MAX_EMPLOYEE_SKILL_LEVEL } from '@/types/game';
import { Icon } from '@/components/ui/Icon';
import { EMPLOYEE_TEMPLATES, trainEmployeeCost } from '@/data/employees';
import { getBusinessTemplate } from '@/data/businesses';
import { employeeCapacity, employeeCapacityUsed } from '@/lib/gameEngine';
import { formatMoney } from '@/lib/format';

export function EmployeeRosterRow({
  employee,
  state,
  onAssign,
  onFire,
  onTrain,
}: {
  employee: Employee;
  state: GameState;
  onAssign: (businessId: string | null) => void;
  onFire: () => void;
  onTrain: () => void;
}) {
  const def = EMPLOYEE_TEMPLATES[employee.type];
  const availableBusinesses = state.businesses.filter((b) => {
    if (b.instanceId === employee.assignedBusinessId) return true;
    return employeeCapacityUsed(b) < employeeCapacity(b);
  });
  const skillLevel = employee.skillLevel ?? 0;
  const trainCost = trainEmployeeCost(def.baseHireCost, skillLevel);
  const maxed = trainCost === null;
  const affordable = trainCost !== null && state.cash >= trainCost;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700/40 text-navy-200">
        <Icon name={def.icon} className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-[120px] flex-1">
        <p className="text-xs font-medium text-white">{employee.name}</p>
        <p className="text-[11px] text-white/40">{def.name} &middot; {formatMoney(employee.hourlySalary)}/hr</p>
        <div className="mt-1 flex items-center gap-1">
          {Array.from({ length: MAX_EMPLOYEE_SKILL_LEVEL }).map((_, i) => (
            <span
              key={i}
              className={`h-1 w-3 rounded-full ${i < skillLevel ? 'bg-gold-500' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <select
        value={employee.assignedBusinessId ?? ''}
        onChange={(e) => onAssign(e.target.value || null)}
        aria-label={`Assign ${employee.name} to a business`}
        className="rounded-lg border border-white/10 bg-ink-900/70 px-2.5 py-1.5 text-xs text-white outline-none focus:border-gold-500/50"
      >
        <option value="">Unassigned</option>
        {availableBusinesses.map((b) => {
          const t = getBusinessTemplate(b.templateId);
          return (
            <option key={b.instanceId} value={b.instanceId}>
              {t?.name}
            </option>
          );
        })}
      </select>

      <button
        onClick={onTrain}
        disabled={maxed || !affordable}
        title={maxed ? 'Fully trained' : `Train for ${formatMoney(trainCost ?? 0)}`}
        aria-label={maxed ? `${employee.name} is fully trained` : `Train ${employee.name} for ${formatMoney(trainCost ?? 0)}`}
        className="flex items-center gap-1.5 rounded-lg border border-gold-500/20 bg-gold-500/5 px-2.5 py-1.5 text-[11px] font-medium text-gold-300 hover:bg-gold-500/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-gold-500/5"
      >
        <GraduationCap className="h-3.5 w-3.5" />
        {maxed ? 'Max' : formatMoney(trainCost ?? 0, { compact: true })}
      </button>

      <button
        onClick={onFire}
        className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
        title="Fire employee"
        aria-label={`Fire ${employee.name}`}
      >
        <UserMinus className="h-4 w-4" />
      </button>
    </div>
  );
}
