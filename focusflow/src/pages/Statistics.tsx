import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Flame, ListChecks, Target, Timer } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/statistics/StatTile';
import { dailyActivity, currentDailyStreak, overallHabitCompletionRate, isGoalComplete } from '@/lib/derived';

const CHART_COLORS = { primary: '#6366f1', success: '#16a34a', warning: '#d97706' };

export default function Statistics() {
  const tasks = useAppStore((s) => s.tasks);
  const goals = useAppStore((s) => s.goals);
  const habits = useAppStore((s) => s.habits);
  const focusSessions = useAppStore((s) => s.focusSessions);

  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const goalsCompleted = goals.filter((g) => isGoalComplete(g, tasks)).length;
  const focusSessionsCompleted = focusSessions.filter((s) => s.type === 'focus' && s.completedAt).length;
  const habitRate = overallHabitCompletionRate(habits, 7);
  const streak = currentDailyStreak(tasks, habits);

  const activity = dailyActivity(tasks, habits, focusSessions, 7);
  const hasAnyActivity = activity.some((d) => d.tasksCompleted > 0 || d.focusMinutes > 0) || habits.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Statistics</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">A look at your productivity over the last 7 days.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile icon={ListChecks} label="Tasks completed" value={tasksCompleted} tone="primary" />
        <StatTile icon={Target} label="Goals completed" value={goalsCompleted} tone="success" />
        <StatTile icon={CheckCircle2} label="Habit completion" value={`${habitRate}%`} tone="warning" />
        <StatTile icon={Timer} label="Focus sessions" value={focusSessionsCompleted} tone="primary" />
        <StatTile icon={Flame} label="Current streak" value={`${streak}d`} tone="danger" />
      </div>

      {!hasAnyActivity ? (
        <Card className="p-8 text-center text-sm text-[var(--color-text-muted)]">
          No activity yet — complete a task, mark a habit, or finish a focus session to see your stats here.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Tasks completed per day</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: 13 }}
                />
                <Bar dataKey="tasksCompleted" name="Tasks" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Focus minutes per day</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: 13 }}
                />
                <Area type="monotone" dataKey="focusMinutes" name="Minutes" stroke={CHART_COLORS.success} fill="url(#focusGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Habit completion rate</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Completion']}
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: 13 }}
                />
                <Bar dataKey="habitCompletionRate" name="Completion" fill={CHART_COLORS.warning} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
