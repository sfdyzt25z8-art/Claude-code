import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Textarea } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/store/useToastStore';
import type { Goal } from '@/types';
import { isValidISODate } from '@/lib/date';

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
}

const colorOptions = ['#6366f1', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#a855f7', '#ec4899'];

interface FormValues {
  name: string;
  description: string;
  deadline: string;
  color: string;
}

const emptyForm: FormValues = { name: '', description: '', deadline: '', color: colorOptions[0] };

export function GoalFormModal({ open, onClose, goal }: GoalFormModalProps) {
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);

  const [values, setValues] = useState<FormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (goal) {
      setValues({
        name: goal.name,
        description: goal.description ?? '',
        deadline: goal.deadline ?? '',
        color: goal.color,
      });
    } else {
      setValues(emptyForm);
    }
    setError(null);
  }, [open, goal]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = values.name.trim();
    if (!name) {
      setError('Give the goal a name.');
      return;
    }
    if (values.deadline && !isValidISODate(values.deadline)) {
      setError('That deadline looks invalid.');
      return;
    }

    const payload = {
      name,
      description: values.description.trim() || undefined,
      deadline: values.deadline || undefined,
      color: values.color,
    };

    if (goal) {
      updateGoal(goal.id, payload);
      toast('Goal updated', 'success');
    } else {
      addGoal(payload);
      toast('Goal created', 'success');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit goal' : 'New goal'}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field label="Goal name" htmlFor="goal-name" error={error ?? undefined}>
          <Input
            id="goal-name"
            autoFocus
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="e.g. Learn Spanish"
            maxLength={80}
          />
        </Field>

        <Field label="Description (optional)" htmlFor="goal-description">
          <Textarea
            id="goal-description"
            rows={3}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            placeholder="What does success look like?"
            maxLength={500}
          />
        </Field>

        <Field label="Deadline (optional)" htmlFor="goal-deadline">
          <Input
            id="goal-deadline"
            type="date"
            value={values.deadline}
            onChange={(e) => setValues((v) => ({ ...v, deadline: e.target.value }))}
          />
        </Field>

        <Field label="Color" htmlFor="goal-color">
          <div className="flex flex-wrap gap-2" id="goal-color">
            {colorOptions.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Choose color ${c}`}
                aria-pressed={values.color === c}
                onClick={() => setValues((v) => ({ ...v, color: c }))}
                className={`h-8 w-8 rounded-full transition-transform ${
                  values.color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-[var(--color-surface)]' : ''
                }`}
                style={{ backgroundColor: c, ['--tw-ring-color' as string]: c }}
              />
            ))}
          </div>
        </Field>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{goal ? 'Save changes' : 'Create goal'}</Button>
        </div>
      </form>
    </Modal>
  );
}
