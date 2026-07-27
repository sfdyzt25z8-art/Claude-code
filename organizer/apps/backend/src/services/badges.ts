export type BadgeKey =
  | "first_quiz"
  | "quiz_perfect"
  | "quiz_master"
  | "streak_7"
  | "streak_30"
  | "first_goal_completed"
  | "first_homework"
  | "first_study_session"
  | "habit_builder"
  | "academy_graduate";

export interface BadgeDefinition {
  key: BadgeKey;
  name: string;
  description: string;
  icon: string;
}

/**
 * The canonical set of badges Organizer awards. Used both by `prisma/seed.ts`
 * (to pre-populate the Badge table) and by `services/gamification.ts` (which
 * upserts by key on demand, so awarding still works even before seeding).
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "first_quiz",
    name: "First Quiz",
    description: "Completed your first quiz.",
    icon: "🎯",
  },
  {
    key: "quiz_perfect",
    name: "Perfect Score",
    description: "Scored 100% on a quiz.",
    icon: "💯",
  },
  {
    key: "quiz_master",
    name: "Quiz Master",
    description: "Completed 10 quizzes.",
    icon: "🥇",
  },
  {
    key: "streak_7",
    name: "Week Warrior",
    description: "Kept a 7-day activity streak alive.",
    icon: "🔥",
  },
  {
    key: "streak_30",
    name: "Unstoppable",
    description: "Kept a 30-day activity streak alive.",
    icon: "🏆",
  },
  {
    key: "first_goal_completed",
    name: "Goal Getter",
    description: "Completed your first goal.",
    icon: "✅",
  },
  {
    key: "first_homework",
    name: "Homework Hero",
    description: "Completed your first homework assignment.",
    icon: "📚",
  },
  {
    key: "first_study_session",
    name: "Focused Mind",
    description: "Completed your first tracked study session.",
    icon: "🧠",
  },
  {
    key: "habit_builder",
    name: "Habit Builder",
    description: "Logged a habit 7 times.",
    icon: "🌱",
  },
  {
    key: "academy_graduate",
    name: "Academy Graduate",
    description: "Completed every module in an academy.",
    icon: "🎓",
  },
];
