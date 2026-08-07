import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Goal } from '@/types';

export default function Goals() {
  const goals = useAppStore((s) => s.goals);
  const tasks = useAppStore((s) => s.tasks);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskGoalTarget, setTaskGoalTarget] = useState<Goal | null>(null);

  const openNew = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const openAddTask = (goal: Goal) => {
    setTaskGoalTarget(goal);
    setTaskModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Goals</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Break big ambitions into tasks you can actually do.</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> New goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create a goal, then link tasks to it to track real progress."
          action={
            <Button onClick={openNew} size="sm">
              <Plus size={15} /> Create a goal
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} tasks={tasks} onEdit={openEdit} onAddTask={openAddTask} />
          ))}
        </div>
      )}

      <GoalFormModal open={modalOpen} onClose={() => setModalOpen(false)} goal={editingGoal} />
      <TaskFormModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        defaultGoalId={taskGoalTarget?.id}
      />
    </div>
  );
}
