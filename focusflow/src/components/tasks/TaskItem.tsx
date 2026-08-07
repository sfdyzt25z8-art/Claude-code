import { useState } from 'react';
import { Check, Pencil, Trash2, Target } from 'lucide-react';
import type { Task } from '@/types';
import { PriorityBadge, Badge } from '@/components/ui/Badge';
import { formatFriendlyDate, isOverdue } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/store/useToastStore';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  goalName?: string;
}

export function TaskItem({ task, onEdit, goalName }: TaskItemProps) {
  const toggleTaskCompletion = useAppStore((s) => s.toggleTaskCompletion);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const overdue = isOverdue(task.dueDate, task.completed);

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      window.setTimeout(() => setConfirmingDelete(false), 2500);
      return;
    }
    deleteTask(task.id);
    toast('Task deleted', 'info');
  };

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 transition-colors hover:bg-[var(--color-surface-hover)] ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => toggleTaskCompletion(task.id)}
        aria-pressed={task.completed}
        aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          task.completed
            ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white animate-pop'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
        }`}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium text-[var(--color-text)] ${task.completed ? 'line-through' : ''}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-muted)]">{task.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <Badge tone={overdue ? 'danger' : 'default'}>{formatFriendlyDate(task.dueDate)}</Badge>
          )}
          {task.category && <Badge tone="default">{task.category}</Badge>}
          {goalName && (
            <Badge tone="primary">
              <Target size={11} /> {goalName}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={confirmingDelete ? 'Confirm delete task' : 'Delete task'}
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
  );
}
