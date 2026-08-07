import { useMemo, useState } from 'react';
import { Plus, Search, ListChecks } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormControls';
import type { Priority, Task } from '@/types';

type StatusFilter = 'all' | 'active' | 'completed';
type PriorityFilter = 'all' | Priority;

export default function Tasks() {
  const tasks = useAppStore((s) => s.tasks);
  const goals = useAppStore((s) => s.goals);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category).filter((c): c is string => Boolean(c)))).sort(),
    [tasks],
  );

  const goalNameById = useMemo(() => new Map(goals.map((g) => [g.id, g.name])), [goals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => (status === 'active' ? !t.completed : status === 'completed' ? t.completed : true))
      .filter((t) => (priority === 'all' ? true : t.priority === priority))
      .filter((t) => (category === 'all' ? true : t.category === category))
      .filter((t) => (q ? t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const order = { high: 0, medium: 1, low: 2 } as const;
        if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
        return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
      });
  }, [tasks, search, status, priority, category]);

  const openNew = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const hasAnyFilters = search || status !== 'all' || priority !== 'all' || category !== 'all';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {tasks.filter((t) => !t.completed).length} open · {tasks.filter((t) => t.completed).length} done
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> New task
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
            aria-label="Search tasks"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} aria-label="Filter by status">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as PriorityFilter)} aria-label="Filter by priority">
            <option value="all">All priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={hasAnyFilters ? 'No tasks match your filters' : 'No tasks yet'}
          description={hasAnyFilters ? 'Try clearing a filter or search term.' : 'Create your first task to get started.'}
          action={
            !hasAnyFilters && (
              <Button onClick={openNew} size="sm">
                <Plus size={15} /> Add a task
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={openEdit} goalName={task.goalId ? goalNameById.get(task.goalId) : undefined} />
          ))}
        </div>
      )}

      <TaskFormModal open={modalOpen} onClose={() => setModalOpen(false)} task={editingTask} />
    </div>
  );
}
