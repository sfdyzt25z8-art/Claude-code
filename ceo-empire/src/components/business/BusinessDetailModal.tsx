import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, UserMinus, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useGameStore } from '@/store/gameStore';
import { getBusinessTemplate } from '@/data/businesses';
import { UPGRADE_DEFINITIONS } from '@/data/upgrades';
import { upgradeCost } from '@/data/upgrades';
import { UPGRADE_TYPES, MAX_UPGRADE_LEVEL, type OwnedBusiness } from '@/types/game';
import { businessFinancials, employeeCapacity, employeeCapacityUsed } from '@/lib/gameEngine';
import { EMPLOYEE_TEMPLATES } from '@/data/employees';
import { formatMoney } from '@/lib/format';
import { playSound } from '@/lib/audio';

export function BusinessDetailModal({
  businessId,
  onClose,
}: {
  businessId: string | null;
  onClose: () => void;
}) {
  const state = useGameStore((s) => s.state);
  const upgradeBusiness = useGameStore((s) => s.upgradeBusiness);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const [error, setError] = useState<string | null>(null);
  // Always looked up live from the store so upgrades purchased inside this modal
  // are reflected immediately instead of showing a stale snapshot.
  const liveBusiness = businessId
    ? (state.businesses.find((b) => b.instanceId === businessId) ?? null)
    : null;
  const [displayed, setDisplayed] = useState<OwnedBusiness | null>(liveBusiness);

  useEffect(() => {
    if (liveBusiness) setDisplayed(liveBusiness);
  }, [liveBusiness]);

  const template = displayed ? getBusinessTemplate(displayed.templateId) : null;
  if (!displayed || !template) {
    return null;
  }

  const fin = businessFinancials(displayed, state.employees, state.activeEvents);
  const assignedEmployees = state.employees.filter((e) => e.assignedBusinessId === displayed.instanceId);
  const capacityUsed = employeeCapacityUsed(displayed);
  const capacity = employeeCapacity(displayed);

  function handleUpgrade(type: (typeof UPGRADE_TYPES)[number]) {
    if (!displayed) return;
    setError(null);
    const result = upgradeBusiness(displayed.instanceId, type);
    if (result.ok) {
      playSound('upgrade');
    } else {
      playSound('error');
      setError(result.error ?? 'Could not upgrade.');
    }
  }

  return (
    <Modal open={!!businessId} onClose={onClose} title={template.name} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
            <Icon name={template.icon} className="h-6 w-6" />
          </div>
          <div className="grid flex-1 grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-white/40">Income</p>
              <p className="flex items-center gap-1 font-semibold text-emerald-400">
                <ArrowUpRight className="h-3.5 w-3.5" /> {formatMoney(fin.hourlyIncome, { compact: true })}
              </p>
            </div>
            <div>
              <p className="text-white/40">Expenses</p>
              <p className="flex items-center gap-1 font-semibold text-red-400">
                <ArrowDownRight className="h-3.5 w-3.5" /> {formatMoney(fin.hourlyExpense, { compact: true })}
              </p>
            </div>
            <div>
              <p className="text-white/40">Profit / hr</p>
              <p className="font-semibold text-white">{formatMoney(fin.hourlyProfit, { compact: true })}</p>
            </div>
          </div>
        </div>

        {fin.neglectPenalty > 0.5 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/[0.06] p-3 text-xs text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Losing an extra <span className="font-semibold">{formatMoney(fin.neglectPenalty, { compact: true })}/hr</span> to
              competitors — you haven't invested in Marketing or Staff Training. Upgrade either one below to win it back.
            </p>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Upgrades</h3>
          <div className="flex flex-col gap-2">
            {UPGRADE_TYPES.map((type) => {
              const def = UPGRADE_DEFINITIONS[type];
              const level = displayed.upgrades[type] ?? 0;
              const cost = upgradeCost(type, template.baseCost, level);
              const maxed = level >= MAX_UPGRADE_LEVEL;
              return (
                <div
                  key={type}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700/40 text-navy-200">
                    <Icon name={def.icon} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-white">{def.label}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: MAX_UPGRADE_LEVEL }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-4 rounded-full ${i < level ? 'bg-gold-500' : 'bg-white/10'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-white/40">{def.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={maxed || cost === null || state.cash < (cost ?? Infinity)}
                    onClick={() => handleUpgrade(type)}
                    className="shrink-0"
                  >
                    {maxed ? 'Max' : formatMoney(cost ?? 0, { compact: true })}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Employees ({capacityUsed}/{capacity})
            </h3>
            <Link to="/employees" className="text-xs text-gold-400 hover:text-gold-300">
              Hire more
            </Link>
          </div>
          {assignedEmployees.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/30">
              No employees assigned yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {assignedEmployees.map((emp) => {
                const empDef = EMPLOYEE_TEMPLATES[emp.type];
                return (
                  <div
                    key={emp.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-700/40 text-navy-200">
                      <Icon name={empDef.icon} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{emp.name}</p>
                      <p className="text-[11px] text-white/40">{empDef.name} &middot; {formatMoney(emp.hourlySalary)}/hr</p>
                    </div>
                    <button
                      onClick={() => fireEmployee(emp.id)}
                      className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                      title="Fire employee"
                      aria-label={`Fire ${emp.name}`}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}
