import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { EMPLOYEE_TEMPLATES } from '@/data/employees';
import type { EmployeeType } from '@/types/game';
import { HireCard } from '@/components/employee/HireCard';
import { EmployeeRosterRow } from '@/components/employee/EmployeeRosterRow';
import { Card } from '@/components/ui/Card';
import { playSound } from '@/lib/audio';

export default function EmployeesPage() {
  const state = useGameStore((s) => s.state);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const assignEmployee = useGameStore((s) => s.assignEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const [error, setError] = useState<string | null>(null);

  function handleHire(type: EmployeeType, businessId: string | null) {
    setError(null);
    const result = hireEmployee(type, businessId);
    if (result.ok) {
      playSound('hire');
    } else {
      playSound('error');
      setError(result.error ?? 'Could not hire employee.');
    }
  }

  function handleAssign(employeeId: string, businessId: string | null) {
    setError(null);
    const result = assignEmployee(employeeId, businessId);
    if (!result.ok) {
      playSound('error');
      setError(result.error ?? 'Could not reassign employee.');
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Employees</h1>
        <p className="text-sm text-white/40">Hire talent to boost income and cut costs across your empire.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">Hire New Employee</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(EMPLOYEE_TEMPLATES).map((template) => (
            <HireCard
              key={template.type}
              template={template}
              state={state}
              onHire={(businessId) => handleHire(template.type, businessId)}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">
          Your Team ({state.employees.length})
        </h2>
        <Card className="p-4">
          {state.employees.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">
              You haven't hired anyone yet. Hire your first employee above.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {state.employees.map((emp) => (
                <EmployeeRosterRow
                  key={emp.id}
                  employee={emp}
                  state={state}
                  onAssign={(businessId) => handleAssign(emp.id, businessId)}
                  onFire={() => fireEmployee(emp.id)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
