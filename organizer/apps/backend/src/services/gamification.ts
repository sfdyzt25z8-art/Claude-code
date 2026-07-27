import { levelForXp } from "@organizer/shared";
import type { Academy, Gamification, UserBadge } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { BADGE_DEFINITIONS, type BadgeKey } from "./badges";

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function ensureGamification(userId: string): Promise<Gamification> {
  return prisma.gamification.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

/** Adds XP (and optional coins), recomputes level, and logs an XpEvent audit row. */
export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
  coins = 0
): Promise<Gamification> {
  await ensureGamification(userId);
  const current = await prisma.gamification.findUniqueOrThrow({ where: { userId } });
  const newXp = current.xp + amount;
  const newLevel = levelForXp(newXp);

  const [updated] = await prisma.$transaction([
    prisma.gamification.update({
      where: { userId },
      data: { xp: newXp, level: newLevel, coins: { increment: coins } },
    }),
    prisma.xpEvent.create({ data: { userId, amount, reason } }),
  ]);

  return updated;
}

/**
 * Call once per "day the user did something meaningful" (quiz submitted,
 * habit logged, study session ended, etc). Increments the streak if the last
 * activity was yesterday, resets it if there was a gap, and is a no-op if
 * already recorded for today. Awards the 7/30-day streak badges in passing.
 */
export async function updateStreak(userId: string): Promise<Gamification> {
  await ensureGamification(userId);
  const current = await prisma.gamification.findUniqueOrThrow({ where: { userId } });

  const now = new Date();
  const today = startOfDay(now);
  const last = current.lastActivityDate ? startOfDay(current.lastActivityDate) : null;

  let currentStreak = current.currentStreak;
  if (!last) {
    currentStreak = 1;
  } else {
    const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);
    if (diffDays === 0) {
      // Already active today - streak unchanged.
    } else if (diffDays === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(current.longestStreak, currentStreak);

  const updated = await prisma.gamification.update({
    where: { userId },
    data: { currentStreak, longestStreak, lastActivityDate: now },
  });

  if (currentStreak === 7) await awardBadge(userId, "streak_7");
  if (currentStreak === 30) await awardBadge(userId, "streak_30");

  return updated;
}

/** Idempotent: awarding the same badge twice is a no-op (unique[userId,badgeId]). */
export async function awardBadge(userId: string, key: BadgeKey): Promise<UserBadge | null> {
  const definition = BADGE_DEFINITIONS.find((b) => b.key === key);
  if (!definition) return null;

  const badge = await prisma.badge.upsert({
    where: { key },
    update: {},
    create: definition,
  });

  const already = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (already) return already;

  return prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
}

export async function checkBadgesAfterQuiz(userId: string, scorePercent: number): Promise<void> {
  const quizCount = await prisma.quizAttempt.count({ where: { userId } });
  if (quizCount === 1) await awardBadge(userId, "first_quiz");
  if (quizCount === 10) await awardBadge(userId, "quiz_master");
  if (scorePercent >= 100) await awardBadge(userId, "quiz_perfect");
}

export async function checkBadgeAfterGoalCompleted(userId: string): Promise<void> {
  const [businessGoals, personalGoals] = await Promise.all([
    prisma.businessGoal.count({ where: { userId, completed: true } }),
    prisma.personalGoal.count({ where: { userId, completed: true } }),
  ]);
  if (businessGoals + personalGoals === 1) await awardBadge(userId, "first_goal_completed");
}

export async function checkBadgeAfterHomework(userId: string): Promise<void> {
  const count = await prisma.homework.count({ where: { userId, completed: true } });
  if (count === 1) await awardBadge(userId, "first_homework");
}

export async function checkBadgeAfterStudySession(userId: string): Promise<void> {
  const count = await prisma.studySession.count({ where: { userId, endedAt: { not: null } } });
  if (count === 1) await awardBadge(userId, "first_study_session");
}

export async function checkBadgeAfterHabitLog(userId: string): Promise<void> {
  const count = await prisma.habitLog.count({ where: { userId, completed: true } });
  if (count === 7) await awardBadge(userId, "habit_builder");
}

export async function checkBadgeAfterAcademyModule(userId: string, academy: Academy): Promise<void> {
  const [totalModules, completedModules] = await Promise.all([
    prisma.academyModule.count({ where: { academy } }),
    prisma.academyProgress.count({ where: { userId, academy, completed: true } }),
  ]);
  if (totalModules > 0 && completedModules === totalModules) {
    await awardBadge(userId, "academy_graduate");
  }
}
