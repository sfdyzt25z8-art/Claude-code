import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Target, Timer, Repeat, ArrowRight, Play, Pause, ListChecks, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useFocusTimerStore } from '@/store/useFocusTimerStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { HabitFormModal } from '@/components/habits/HabitFormModal';
import { getHabitIcon } from '@/components/habits/habitIcons';
import { goalProgress, habitStreakInfo, todaysProgress, todaysTasks } from '@/lib/derived';
import { formatFullDate, getGreeting, todayISODate } from '@/lib/date';
import type { Task } from '@/types';

function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function Dashboard() {
  const tasks = useAppStore((s) => s.tasks);
  const goals = useAppStore((s) => s.goals);
  const habits = useAppStore((s) => s.habits);
  const userName = useAppStore((s) => s.settings.profile.name);
  const toggleHabitCompletion = useAppStore((s) => s.toggleHabitCompletion);
  const hasSeededSampleData = useAppStore((s) => s.hasSeededSampleData);
  const loadSampleData = useAppStore((s) => s.loadSampleData);
  const timer = useFocusTimerStore();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [habitModalOpen, setHabitModalOpen] = useState(false);

  const today = todaysTasks(tasks);
  const progress = todaysProgress(tasks);
  const activeGoals = goals.filter((g) => !g.completedAt).slice(0, 3);
  const goalNameById = new Map(goals.map((g) => [g.id, g.name]));

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const openNewTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const greetName = userName && userName !== 'there' ? `, ${userName}` : '';
  const phaseLabel = timer.phase === 'focus' ? 'Focus session' : timer.isLongBreak ? 'Long break' : 'Short break';
  const isEmptyWorkspace = tasks.length === 0 && goals.length === 0 && habits.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {isEmptyWorkspace && !hasSeededSampleData && (
        <Card className="flex flex-col items-start gap-3 border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-medium text-[var(--color-text)]">Your workspace is empty</p>
              <p className="text-sm text-[var(--color-text-muted)]">Load a few sample tasks, goals, and habits to see FocusFlow in action.</p>
            </div>
          </div>
          <Button size="sm" onClick={loadSampleData}>
            Load sample data
          </Button>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            {getGreeting()}
            {greetName} 👋
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {formatFullDate()} — here&apos;s what you have planned today.
          </p>
        </div>
        <Button onClick={openNewTask}>
          <Plus size={16} /> Quick-add task
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text)]">Today&apos;s progress</h2>
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              {today.filter((t) => t.completed).length}/{today.length} tasks
            </span>
          </div>
          <ProgressBar value={progress} height={10} />
          <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
            {progress === 100 && today.length > 0
              ? "Everything's done for today. Nice work!"
              : `${progress}% complete`}
          </p>
        </Card>

        <Card className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{phaseLabel}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text)]">{formatClock(timer.remainingMs)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => (timer.isRunning ? timer.pause() : timer.start())}
              aria-label={timer.isRunning ? 'Pause timer' : 'Start timer'}
            >
              {timer.isRunning ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Link to="/focus">
              <Button variant="ghost" size="icon" aria-label="Open focus timer">
                <Timer size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text)]">Today&apos;s tasks</h2>
            <Link to="/tasks" className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {today.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Nothing due today"
              description="Add a task to get your day started."
              action={
                <Button onClick={openNewTask} size="sm">
                  <Plus size={15} /> Add a task
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {today.map((task) => (
                <TaskItem key={task.id} task={task} onEdit={openEdit} goalName={task.goalId ? goalNameById.get(task.goalId) : undefined} />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text)]">Habits today</h2>
            <Link to="/habits" className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {habits.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No habits yet"
              description="Track something small and consistent."
              action={
                <Button onClick={() => setHabitModalOpen(true)} size="sm">
                  <Plus size={15} /> Add a habit
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {habits.slice(0, 5).map((habit) => {
                const Icon = getHabitIcon(habit.icon);
                const info = habitStreakInfo(habit);
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggleHabitCompletion(habit.id, todayISODate())}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                      info.completedToday
                        ? 'border-[var(--color-success)]/30 bg-[var(--color-success-soft)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">{habit.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{info.currentStreak} day streak</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Current goals</h2>
          <Link to="/goals" className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {activeGoals.length === 0 ? (
          <EmptyState icon={Target} title="No active goals" description="Create a goal to start tracking progress." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {activeGoals.map((goal) => {
              const progressPct = goalProgress(goal, tasks);
              return (
                <div key={goal.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-[var(--color-text)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: goal.color }} />
                      {goal.name}
                    </span>
                    <span className="text-[var(--color-text-muted)]">{progressPct}%</span>
                  </div>
                  <ProgressBar value={progressPct} color={goal.color} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <TaskFormModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} task={editingTask} defaultDueDate={todayISODate()} />
      <HabitFormModal open={habitModalOpen} onClose={() => setHabitModalOpen(false)} />
    </div>
  );
}
