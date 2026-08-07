import type { Goal, Habit, Task } from '@/types';
import { createId } from '@/lib/id';
import { addDaysISO, todayISODate } from '@/lib/date';

/** Optional starter data so a first-time user doesn't land on an empty app.
 * Every piece is clearly removable via Settings -> Reset Data. */
export function createSampleData(): { tasks: Task[]; goals: Goal[]; habits: Habit[] } {
  const now = new Date().toISOString();
  const today = todayISODate();

  const learnSpanishGoal: Goal = {
    id: createId(),
    name: 'Learn Spanish',
    description: 'Get to conversational fluency for the trip in the fall.',
    deadline: addDaysISO(today, 45),
    color: '#6366f1',
    createdAt: now,
  };

  const launchProjectGoal: Goal = {
    id: createId(),
    name: 'Finish a project',
    description: 'Ship the side project I have been chipping away at.',
    deadline: addDaysISO(today, 14),
    color: '#0ea5e9',
    createdAt: now,
  };

  const dailyRoutineGoal: Goal = {
    id: createId(),
    name: 'Build a daily routine',
    description: 'Establish a consistent morning and evening routine.',
    deadline: addDaysISO(today, 30),
    color: '#16a34a',
    createdAt: now,
  };

  const goals: Goal[] = [learnSpanishGoal, launchProjectGoal, dailyRoutineGoal];

  const tasks: Task[] = [
    {
      id: createId(),
      title: 'Finish homework',
      priority: 'high',
      dueDate: today,
      category: 'School',
      completed: false,
      createdAt: now,
    },
    {
      id: createId(),
      title: 'Read 20 pages',
      description: 'Continue reading Duolingo Spanish short stories.',
      priority: 'medium',
      dueDate: today,
      category: 'Learning',
      goalId: learnSpanishGoal.id,
      completed: false,
      createdAt: now,
    },
    {
      id: createId(),
      title: 'Practice a skill',
      description: '30 minutes of focused practice.',
      priority: 'medium',
      dueDate: today,
      category: 'Personal',
      completed: true,
      completedAt: now,
      createdAt: now,
    },
    {
      id: createId(),
      title: 'Plan tomorrow',
      priority: 'low',
      dueDate: today,
      category: 'Planning',
      completed: false,
      createdAt: now,
    },
    {
      id: createId(),
      title: 'Set up project repository',
      priority: 'high',
      dueDate: addDaysISO(today, -1),
      category: 'Project',
      goalId: launchProjectGoal.id,
      completed: true,
      completedAt: now,
      createdAt: now,
    },
    {
      id: createId(),
      title: 'Draft feature roadmap',
      priority: 'medium',
      dueDate: addDaysISO(today, 3),
      category: 'Project',
      goalId: launchProjectGoal.id,
      completed: false,
      createdAt: now,
    },
    {
      id: createId(),
      title: 'Write morning routine checklist',
      priority: 'low',
      dueDate: addDaysISO(today, 1),
      category: 'Personal',
      goalId: dailyRoutineGoal.id,
      completed: false,
      createdAt: now,
    },
  ];

  const daysAgo = (n: number) => addDaysISO(today, -n);

  const habits: Habit[] = [
    {
      id: createId(),
      name: 'Read',
      icon: 'BookOpen',
      targetDaysPerWeek: 5,
      completions: [daysAgo(3), daysAgo(2), daysAgo(1), today],
      createdAt: now,
    },
    {
      id: createId(),
      name: 'Exercise',
      icon: 'Dumbbell',
      targetDaysPerWeek: 4,
      completions: [daysAgo(6), daysAgo(4), daysAgo(2)],
      createdAt: now,
    },
    {
      id: createId(),
      name: 'Study Spanish',
      icon: 'GraduationCap',
      targetDaysPerWeek: 6,
      completions: [daysAgo(4), daysAgo(3), daysAgo(2), daysAgo(1), today],
      createdAt: now,
    },
    {
      id: createId(),
      name: 'Drink water',
      icon: 'GlassWater',
      targetDaysPerWeek: 7,
      completions: [daysAgo(5), daysAgo(4), daysAgo(3), daysAgo(2), daysAgo(1), today],
      createdAt: now,
    },
  ];

  return { tasks, goals, habits };
}
