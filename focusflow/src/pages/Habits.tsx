import { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitFormModal } from '@/components/habits/HabitFormModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Habit } from '@/types';

export default function Habits() {
  const habits = useAppStore((s) => s.habits);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const openNew = () => {
    setEditingHabit(null);
    setModalOpen(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Habits</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Small, consistent actions compound over time.</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> New habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Track something small and consistent — reading, exercise, drinking water."
          action={
            <Button onClick={openNew} size="sm">
              <Plus size={15} /> Add a habit
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={openEdit} />
          ))}
        </div>
      )}

      <HabitFormModal open={modalOpen} onClose={() => setModalOpen(false)} habit={editingHabit} />
    </div>
  );
}
