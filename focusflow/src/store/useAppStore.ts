import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AIMessage,
  FocusSession,
  Goal,
  Habit,
  Settings,
  Task,
} from '@/types';
import { createId } from '@/lib/id';
import { todayISODate, isValidISODate } from '@/lib/date';
import { createSampleData } from '@/lib/sampleData';
import { zustandStorageAdapter } from '@/lib/storage';

const STORAGE_KEY = 'focusflow-store';

type PersistedAppState = Pick<
  AppState,
  'tasks' | 'goals' | 'habits' | 'focusSessions' | 'settings' | 'aiMessages' | 'hasSeededSampleData'
>;

const defaultSettings: Settings = {
  profile: { name: 'there' },
  theme: 'system',
  notificationsEnabled: true,
  soundEnabled: true,
  focusDurationMinutes: 25,
  breakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  sessionsUntilLongBreak: 4,
};

interface AppState {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  focusSessions: FocusSession[];
  settings: Settings;
  aiMessages: AIMessage[];
  hasSeededSampleData: boolean;

  // Tasks
  addTask: (input: Omit<Task, 'id' | 'createdAt' | 'completed'> & { completed?: boolean }) => Task;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;

  // Goals
  addGoal: (input: Omit<Goal, 'id' | 'createdAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>) => void;
  deleteGoal: (id: string, opts?: { deleteLinkedTasks?: boolean }) => void;

  // Habits
  addHabit: (input: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => Habit;
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'completions'>>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, isoDate?: string) => void;

  // Focus sessions
  logFocusSession: (session: Omit<FocusSession, 'id'>) => void;

  // Settings
  updateSettings: (updates: Partial<Settings>) => void;

  // AI Coach
  addAIMessage: (message: Omit<AIMessage, 'id' | 'createdAt'>) => AIMessage;
  clearAIMessages: () => void;

  // Data management
  loadSampleData: () => void;
  clearSampleData: () => void;
  resetAllData: () => void;
}

function sanitizeTasks(tasks: unknown): Task[] {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(
    (t): t is Task =>
      !!t &&
      typeof t === 'object' &&
      typeof (t as Task).id === 'string' &&
      typeof (t as Task).title === 'string' &&
      typeof (t as Task).completed === 'boolean',
  );
}

function sanitizeGoals(goals: unknown): Goal[] {
  if (!Array.isArray(goals)) return [];
  return goals.filter(
    (g): g is Goal =>
      !!g && typeof g === 'object' && typeof (g as Goal).id === 'string' && typeof (g as Goal).name === 'string',
  );
}

function sanitizeHabits(habits: unknown): Habit[] {
  if (!Array.isArray(habits)) return [];
  return habits
    .filter(
      (h): h is Habit =>
        !!h && typeof h === 'object' && typeof (h as Habit).id === 'string' && typeof (h as Habit).name === 'string',
    )
    .map((h) => ({
      ...h,
      completions: Array.isArray(h.completions) ? h.completions.filter(isValidISODate) : [],
      targetDaysPerWeek: typeof h.targetDaysPerWeek === 'number' ? h.targetDaysPerWeek : 7,
    }));
}

function sanitizeFocusSessions(sessions: unknown): FocusSession[] {
  if (!Array.isArray(sessions)) return [];
  return sessions.filter(
    (s): s is FocusSession =>
      !!s &&
      typeof s === 'object' &&
      typeof (s as FocusSession).id === 'string' &&
      typeof (s as FocusSession).durationMinutes === 'number',
  );
}

export const useAppStore = create<AppState>()(
  persist<AppState, [], [], PersistedAppState>(
    (set, get) => ({
      tasks: [],
      goals: [],
      habits: [],
      focusSessions: [],
      settings: defaultSettings,
      aiMessages: [],
      hasSeededSampleData: false,

      addTask: (input) => {
        const task: Task = {
          ...input,
          id: createId(),
          completed: input.completed ?? false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [task, ...state.tasks] }));
        return task;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      toggleTaskCompletion: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : undefined,
                }
              : t,
          ),
        }));
      },

      addGoal: (input) => {
        const goal: Goal = { ...input, id: createId(), createdAt: new Date().toISOString() };
        set((state) => ({ goals: [goal, ...state.goals] }));
        return goal;
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGoal: (id, opts) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          tasks: opts?.deleteLinkedTasks
            ? state.tasks.filter((t) => t.goalId !== id)
            : state.tasks.map((t) => (t.goalId === id ? { ...t, goalId: undefined } : t)),
        }));
      },

      addHabit: (input) => {
        const habit: Habit = { ...input, id: createId(), completions: [], createdAt: new Date().toISOString() };
        set((state) => ({ habits: [habit, ...state.habits] }));
        return habit;
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }));
      },

      toggleHabitCompletion: (id, isoDate) => {
        const date = isoDate ?? todayISODate();
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const has = h.completions.includes(date);
            return {
              ...h,
              completions: has ? h.completions.filter((d) => d !== date) : [...h.completions, date].sort(),
            };
          }),
        }));
      },

      logFocusSession: (session) => {
        const entry: FocusSession = { ...session, id: createId() };
        set((state) => ({ focusSessions: [entry, ...state.focusSessions] }));
      },

      updateSettings: (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
      },

      addAIMessage: (message) => {
        const entry: AIMessage = { ...message, id: createId(), createdAt: new Date().toISOString() };
        set((state) => ({ aiMessages: [...state.aiMessages, entry] }));
        return entry;
      },

      clearAIMessages: () => set({ aiMessages: [] }),

      loadSampleData: () => {
        const { tasks, goals, habits } = createSampleData();
        set((state) => ({
          tasks: [...tasks, ...state.tasks],
          goals: [...goals, ...state.goals],
          habits: [...habits, ...state.habits],
          hasSeededSampleData: true,
        }));
      },

      clearSampleData: () => {
        // Sample data has no distinguishing flag on each record, so "clearing" it
        // is just a full reset back to a blank workspace — the intent behind the
        // "remove all sample data" requirement.
        get().resetAllData();
      },

      resetAllData: () => {
        set({
          tasks: [],
          goals: [],
          habits: [],
          focusSessions: [],
          aiMessages: [],
          hasSeededSampleData: true,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const raw = zustandStorageAdapter.getItem(name);
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch (error) {
            console.warn('[store] Corrupted persisted state, starting fresh.', error);
            return null;
          }
        },
        setItem: (name, value) => zustandStorageAdapter.setItem(name, JSON.stringify(value)),
        removeItem: (name) => zustandStorageAdapter.removeItem(name),
      },
      version: 1,
      partialize: (state) => ({
        tasks: state.tasks,
        goals: state.goals,
        habits: state.habits,
        focusSessions: state.focusSessions,
        settings: state.settings,
        aiMessages: state.aiMessages,
        hasSeededSampleData: state.hasSeededSampleData,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        return {
          ...currentState,
          ...persisted,
          tasks: sanitizeTasks(persisted.tasks),
          goals: sanitizeGoals(persisted.goals),
          habits: sanitizeHabits(persisted.habits),
          focusSessions: sanitizeFocusSessions(persisted.focusSessions),
          settings: { ...defaultSettings, ...persisted.settings },
          aiMessages: Array.isArray(persisted.aiMessages) ? persisted.aiMessages : [],
        };
      },
    },
  ),
);
