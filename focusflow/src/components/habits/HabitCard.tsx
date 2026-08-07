import { useState } from 'react';
import { Check, Flame, Pencil, Trash2, Trophy } from 'lucide-react';
import type { Habit } from '@/types';
import { Card } from '@/components/ui/Card';
import { getHabitIcon } from '@/components/habits/habitIcons';
import { habitStreakInfo } from '@/lib/derived';
import { weekDates, todayISODate } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/store/useToastStore';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HabitCard({ habit, onEdit }: HabitCardProps) {
  const toggleHabitCompletion = useAppStore((s) => s.toggleHabitCompletion);
  const deleteHabit = useAppStore((s) => s.deleteHabit);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const Icon = getHabitIcon(habit.icon);
  const info = habitStreakInfo(habit);
  const week = weekDates();
  const today = todayISODate();
  const completedSet = new Set(habit.completions);

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      window.setTimeout(() => setConfirmingDelete(false), 2500);
      return;
    }
    deleteHabit(habit.id);
    toast('Habit deleted', 'info');
  };

  return (
    <Card className="flex flex-col gap-4 p-5 animate-slide-up">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Icon size={19} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">{habit.name}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {info.weeklyCompletions}/{info.weeklyTarget} this week
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(habit)}
            aria-label="Edit habit"
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={confirmingDelete ? 'Confirm delete habit' : 'Delete habit'}
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

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-[var(--color-warning)]">
          <Flame size={15} />
          <span className="font-medium text-[var(--color-text)]">{info.currentStreak}</span>
          <span className="text-[var(--color-text-muted)]">streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy size={15} className="text-[var(--color-text-subtle)]" />
          <span className="font-medium text-[var(--color-text)]">{info.bestStreak}</span>
          <span className="text-[var(--color-text-muted)]">best</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1">
        {week.map((date, i) => {
          const done = completedSet.has(date);
          const isToday = date === today;
          const isFuture = date > today;
          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              onClick={() => toggleHabitCompletion(habit.id, date)}
              aria-label={`${done ? 'Unmark' : 'Mark'} ${habit.name} complete for ${date}`}
              className={`flex h-9 w-9 flex-col items-center justify-center gap-0.5 rounded-xl border text-[10px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                done
                  ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white animate-pop'
                  : isToday
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {done ? <Check size={14} strokeWidth={3} /> : dayLabels[i]}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => toggleHabitCompletion(habit.id, today)}
        className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
          info.completedToday
            ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
            : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
        }`}
      >
        {info.completedToday ? 'Completed today ✓' : 'Mark done today'}
      </button>
    </Card>
  );
}
