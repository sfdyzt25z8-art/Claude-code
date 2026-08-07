import { useState } from 'react';
import { Calendar, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Goal, Task } from '@/types';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { goalProgress, isGoalComplete, tasksForGoal } from '@/lib/derived';
import { daysUntil, formatFriendlyDate } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/store/useToastStore';

interface GoalCardProps {
  goal: Goal;
  tasks: Task[];
  onEdit: (goal: Goal) => void;
  onAddTask: (goal: Goal) => void;
}

export function GoalCard({ goal, tasks, onEdit, onAddTask }: GoalCardProps) {
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const toggleTaskCompletion = useAppStore((s) => s.toggleTaskCompletion);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const linked = tasksForGoal(goal.id, tasks);
  const progress = goalProgress(goal, tasks);
  const complete = isGoalComplete(goal, tasks);
  const days = daysUntil(goal.deadline);

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      window.setTimeout(() => setConfirmingDelete(false), 2500);
      return;
    }
    deleteGoal(goal.id, { deleteLinkedTasks: false });
    toast('Goal deleted', 'info');
  };

  return (
    <Card className="flex flex-col gap-4 p-5 animate-slide-up">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: goal.color }} />
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">{goal.name}</h3>
            {goal.description && <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{goal.description}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            aria-label="Edit goal"
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={confirmingDelete ? 'Confirm delete goal' : 'Delete goal'}
            className={`rounded-lg p-1.5 transition-colors ${
              confirmingDelete
                ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]'
            }`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--color-text)]">{progress}%</span>
          <span className="text-[var(--color-text-muted)]">
            {linked.filter((t) => t.completed).length}/{linked.length} tasks
          </span>
        </div>
        <ProgressBar value={progress} color={goal.color} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {complete && <Badge tone="success">Complete</Badge>}
        {goal.deadline && (
          <Badge tone={days !== null && days < 0 && !complete ? 'danger' : 'default'}>
            <Calendar size={11} /> {formatFriendlyDate(goal.deadline)}
          </Badge>
        )}
      </div>

      {linked.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3">
          {linked.slice(0, 4).map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => toggleTaskCompletion(t.id)}
                aria-pressed={t.completed}
                aria-label={t.completed ? 'Mark task incomplete' : 'Mark task complete'}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  t.completed ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white' : 'border-[var(--color-border)]'
                }`}
              >
                {t.completed && <Check size={9} strokeWidth={3} />}
              </button>
              <span className={`truncate ${t.completed ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text)]'}`}>
                {t.title}
              </span>
            </li>
          ))}
          {linked.length > 4 && (
            <li className="text-xs text-[var(--color-text-subtle)]">+{linked.length - 4} more</li>
          )}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onAddTask(goal)}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <Plus size={15} /> Add linked task
      </button>
    </Card>
  );
}
