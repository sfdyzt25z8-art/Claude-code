import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/store/useToastStore';
import type { Priority, Task } from '@/types';
import { isValidISODate } from '@/lib/date';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  /** Pre-fill a due date (e.g. "today") or linked goal when opened from a specific context. */
  defaultDueDate?: string;
  defaultGoalId?: string;
}

interface FormValues {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  category: string;
  goalId: string;
}

const emptyForm: FormValues = { title: '', description: '', priority: 'medium', dueDate: '', category: '', goalId: '' };

export function TaskFormModal({ open, onClose, task, defaultDueDate, defaultGoalId }: TaskFormModalProps) {
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const goals = useAppStore((s) => s.goals);
  const tasks = useAppStore((s) => s.tasks);
  const existingCategories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category).filter((c): c is string => Boolean(c)))),
    [tasks],
  );

  const [values, setValues] = useState<FormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setValues({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        dueDate: task.dueDate ?? '',
        category: task.category ?? '',
        goalId: task.goalId ?? '',
      });
    } else {
      setValues({ ...emptyForm, dueDate: defaultDueDate ?? '', goalId: defaultGoalId ?? '' });
    }
    setError(null);
  }, [open, task, defaultDueDate, defaultGoalId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const title = values.title.trim();
    if (!title) {
      setError('Give the task a title.');
      return;
    }
    if (values.dueDate && !isValidISODate(values.dueDate)) {
      setError('That due date looks invalid.');
      return;
    }

    const payload = {
      title,
      description: values.description.trim() || undefined,
      priority: values.priority,
      dueDate: values.dueDate || undefined,
      category: values.category.trim() || undefined,
      goalId: values.goalId || undefined,
    };

    if (task) {
      updateTask(task.id, payload);
      toast('Task updated', 'success');
    } else {
      addTask(payload);
      toast('Task added', 'success');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field label="Title" htmlFor="task-title" error={error ?? undefined}>
          <Input
            id="task-title"
            autoFocus
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            placeholder="e.g. Finish homework"
            maxLength={140}
          />
        </Field>

        <Field label="Description (optional)" htmlFor="task-description">
          <Textarea
            id="task-description"
            rows={3}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            placeholder="Add more detail..."
            maxLength={500}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority" htmlFor="task-priority">
            <Select
              id="task-priority"
              value={values.priority}
              onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value as Priority }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>

          <Field label="Due date" htmlFor="task-due-date">
            <Input
              id="task-due-date"
              type="date"
              value={values.dueDate}
              onChange={(e) => setValues((v) => ({ ...v, dueDate: e.target.value }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category (optional)" htmlFor="task-category">
            <Input
              id="task-category"
              list="task-category-options"
              value={values.category}
              onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
              placeholder="e.g. Work"
              maxLength={40}
            />
            <datalist id="task-category-options">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Linked goal (optional)" htmlFor="task-goal">
            <Select
              id="task-goal"
              value={values.goalId}
              onChange={(e) => setValues((v) => ({ ...v, goalId: e.target.value }))}
            >
              <option value="">No goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{task ? 'Save changes' : 'Add task'}</Button>
        </div>
      </form>
    </Modal>
  );
}
