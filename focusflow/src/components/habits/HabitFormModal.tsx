import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/store/useToastStore';
import type { Habit } from '@/types';
import { getHabitIcon, habitIconNames } from '@/components/habits/habitIcons';

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit | null;
}

interface FormValues {
  name: string;
  icon: string;
  targetDaysPerWeek: number;
}

const emptyForm: FormValues = { name: '', icon: habitIconNames[0], targetDaysPerWeek: 7 };

export function HabitFormModal({ open, onClose, habit }: HabitFormModalProps) {
  const addHabit = useAppStore((s) => s.addHabit);
  const updateHabit = useAppStore((s) => s.updateHabit);

  const [values, setValues] = useState<FormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setValues({ name: habit.name, icon: habit.icon, targetDaysPerWeek: habit.targetDaysPerWeek });
    } else {
      setValues(emptyForm);
    }
    setError(null);
  }, [open, habit]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = values.name.trim();
    if (!name) {
      setError('Give the habit a name.');
      return;
    }

    const payload = { name, icon: values.icon, targetDaysPerWeek: values.targetDaysPerWeek };

    if (habit) {
      updateHabit(habit.id, payload);
      toast('Habit updated', 'success');
    } else {
      addHabit(payload);
      toast('Habit added', 'success');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={habit ? 'Edit habit' : 'New habit'}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field label="Habit name" htmlFor="habit-name" error={error ?? undefined}>
          <Input
            id="habit-name"
            autoFocus
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="e.g. Read"
            maxLength={60}
          />
        </Field>

        <Field label="Icon" htmlFor="habit-icon">
          <div className="grid grid-cols-7 gap-2" id="habit-icon">
            {habitIconNames.map((name) => {
              const Icon = getHabitIcon(name);
              const selected = values.icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-label={`Choose icon ${name}`}
                  aria-pressed={selected}
                  onClick={() => setValues((v) => ({ ...v, icon: name }))}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                    selected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Target days per week" htmlFor="habit-target">
          <Select
            id="habit-target"
            value={values.targetDaysPerWeek}
            onChange={(e) => setValues((v) => ({ ...v, targetDaysPerWeek: Number(e.target.value) }))}
          >
            {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'day' : 'days'}
              </option>
            ))}
          </Select>
        </Field>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{habit ? 'Save changes' : 'Add habit'}</Button>
        </div>
      </form>
    </Modal>
  );
}
