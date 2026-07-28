import { UserMinus } from 'lucide-react';
import type { Employee, GameState } from '@/types/game';
import { Icon } from '@/components/ui/Icon';
import { EMPLOYEE_TEMPLATES } from '@/data/employees';
import { getBusinessTemplate } from '@/data/businesses';
import { employeeCapacity, employeeCapacityUsed } from '@/lib/gameEngine';
import { formatMoney } from '@/lib/format';

export function EmployeeRosterRow({
  employee,
  state,
  onAssign,
  onFire,
}: {
  employee: Employee;
  state: GameState;
  onAssign: (businessId: string | null) => void;
  onFire: () => void;
}) {
  const def = EMPLOYEE_TEMPLATES[employee.type];
  const availableBusinesses = state.businesses.filter((b) => {
    if (b.instanceId === employee.assignedBusinessId) return true;
    return employeeCapacityUsed(b) < employeeCapacity(b);
  });

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700/40 text-navy-200">
        <Icon name={def.icon} className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-[120px] flex-1">
        <p className="text-xs font-medium text-white">{employee.name}</p>
        <p className="text-[11px] text-white/40">{def.name} &middot; {formatMoney(employee.dailySalary)}/day</p>
      </div>

      <select
        value={employee.assignedBusinessId ?? ''}
        onChange={(e) => onAssign(e.target.value || null)}
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
        onClick={onFire}
        className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
        title="Fire employee"
      >
        <UserMinus className="h-4 w-4" />
      </button>
    </div>
  );
}
