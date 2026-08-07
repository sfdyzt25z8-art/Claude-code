import type { FocusSession, Goal, Habit, Task } from '@/types';
import { addDaysISO, lastNDays, parseISODate, todayISODate, toLocalISODateFromISOString, weekDates } from '@/lib/date';

export function tasksForGoal(goalId: string, tasks: Task[]): Task[] {
  return tasks.filter((t) => t.goalId === goalId);
}

/** Goal progress is driven by its linked tasks. A goal with no linked tasks
 * shows 0% until tasks are attached — there is nothing else objective to measure. */
export function goalProgress(goal: Goal, tasks: Task[]): number {
  const linked = tasksForGoal(goal.id, tasks);
  if (linked.length === 0) return 0;
  const completed = linked.filter((t) => t.completed).length;
  return Math.round((completed / linked.length) * 100);
}

export function isGoalComplete(goal: Goal, tasks: Task[]): boolean {
  const linked = tasksForGoal(goal.id, tasks);
  return linked.length > 0 && linked.every((t) => t.completed);
}

export interface HabitStreakInfo {
  currentStreak: number;
  bestStreak: number;
  weeklyCompletions: number;
  weeklyTarget: number;
  completedToday: boolean;
}

export function habitStreakInfo(habit: Habit): HabitStreakInfo {
  const completedSet = new Set(habit.completions);
  const today = todayISODate();
  const completedToday = completedSet.has(today);

  // Current streak: walk backwards from today (or yesterday, if today isn't done yet).
  let currentStreak = 0;
  let cursor = completedToday ? today : addDaysISO(today, -1);
  while (completedSet.has(cursor)) {
    currentStreak += 1;
    cursor = addDaysISO(cursor, -1);
  }

  // Best streak: scan all completions for the longest consecutive run.
  const sorted = [...habit.completions].sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of sorted) {
    if (prev && addDaysISO(prev, 1) === date) {
      run += 1;
    } else {
      run = 1;
    }
    bestStreak = Math.max(bestStreak, run);
    prev = date;
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  const thisWeek = weekDates();
  const weeklyCompletions = thisWeek.filter((d) => completedSet.has(d)).length;

  return {
    currentStreak,
    bestStreak,
    weeklyCompletions,
    weeklyTarget: habit.targetDaysPerWeek,
    completedToday,
  };
}

export function todaysTasks(tasks: Task[]): Task[] {
  const today = todayISODate();
  return tasks.filter((t) => t.dueDate === today);
}

export function todaysProgress(tasks: Task[]): number {
  const today = todaysTasks(tasks);
  if (today.length === 0) return 0;
  const completed = today.filter((t) => t.completed).length;
  return Math.round((completed / today.length) * 100);
}

export function overallHabitCompletionRate(habits: Habit[], days = 7): number {
  if (habits.length === 0) return 0;
  const window = lastNDays(days);
  let possible = 0;
  let done = 0;
  for (const habit of habits) {
    const completedSet = new Set(habit.completions);
    for (const day of window) {
      possible += 1;
      if (completedSet.has(day)) done += 1;
    }
  }
  return possible === 0 ? 0 : Math.round((done / possible) * 100);
}

/** Longest current run of days (including today, walking backward) where the
 * user completed at least one task or one habit — the app-wide "daily streak". */
export function currentDailyStreak(tasks: Task[], habits: Habit[]): number {
  const activeDates = new Set<string>();
  for (const t of tasks) {
    if (t.completed && t.completedAt) activeDates.add(toLocalISODateFromISOString(t.completedAt));
  }
  for (const h of habits) {
    for (const d of h.completions) activeDates.add(d);
  }

  const today = todayISODate();
  let streak = 0;
  let cursor = activeDates.has(today) ? today : addDaysISO(today, -1);
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export function focusSessionsCompletedToday(sessions: FocusSession[]): number {
  const today = todayISODate();
  return sessions.filter(
    (s) => s.type === 'focus' && s.completedAt && toLocalISODateFromISOString(s.completedAt) === today,
  ).length;
}

export function totalFocusMinutes(sessions: FocusSession[]): number {
  return sessions
    .filter((s) => s.type === 'focus' && s.completedAt)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export interface DailyActivity {
  date: string;
  label: string;
  tasksCompleted: number;
  focusMinutes: number;
  habitCompletionRate: number;
}

export function dailyActivity(tasks: Task[], habits: Habit[], sessions: FocusSession[], days = 7): DailyActivity[] {
  const window = lastNDays(days);

  const tasksByDay = new Map<string, number>();
  for (const t of tasks) {
    if (t.completed && t.completedAt) {
      const day = toLocalISODateFromISOString(t.completedAt);
      tasksByDay.set(day, (tasksByDay.get(day) ?? 0) + 1);
    }
  }

  const minutesByDay = new Map<string, number>();
  for (const s of sessions) {
    if (s.type === 'focus' && s.completedAt) {
      const day = toLocalISODateFromISOString(s.completedAt);
      minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + s.durationMinutes);
    }
  }

  return window.map((date) => {
    const habitsDone = habits.filter((h) => h.completions.includes(date)).length;
    const habitCompletionRate = habits.length === 0 ? 0 : Math.round((habitsDone / habits.length) * 100);
    const d = parseISODate(date);
    return {
      date,
      label: d ? d.toLocaleDateString(undefined, { weekday: 'short' }) : date,
      tasksCompleted: tasksByDay.get(date) ?? 0,
      focusMinutes: minutesByDay.get(date) ?? 0,
      habitCompletionRate,
    };
  });
}
