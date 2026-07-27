import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";
import { enumToShared } from "../utils/serialize";

const router = Router();

/**
 * GET /api/statistics
 * A single dashboard-style aggregate endpoint: goal completion, study/reading
 * time, quiz score trend, grade trend per subject, habit completion rate,
 * and (only for business-owner profiles) revenue/expense/profit over time.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [
      businessGoalsCompleted,
      personalGoalsCompleted,
      studySessions,
      readingEntries,
      quizAttempts,
      gradeEntries,
      habitLogs,
    ] = await Promise.all([
      prisma.businessGoal.count({ where: { userId, completed: true } }),
      prisma.personalGoal.count({ where: { userId, completed: true } }),
      prisma.studySession.findMany({ where: { userId }, select: { durationMinutes: true } }),
      prisma.readingEntry.findMany({ where: { userId }, select: { pagesRead: true } }),
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: "asc" },
        select: { completedAt: true, score: true, totalQuestions: true },
      }),
      prisma.gradeEntry.findMany({
        where: { userId },
        orderBy: { date: "asc" },
        select: { subject: true, date: true, score: true, maxScore: true },
      }),
      prisma.habitLog.findMany({ where: { userId }, select: { completed: true } }),
    ]);

    const totalStudyMinutes = studySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalPagesRead = readingEntries.reduce((sum, r) => sum + r.pagesRead, 0);
    // Rough estimate: ~2 minutes per page (no explicit reading-time tracking in the data model).
    const estimatedReadingMinutes = totalPagesRead * 2;

    const quizScoreTrend = quizAttempts.map((a) => ({
      date: a.completedAt.toISOString(),
      scorePercent: a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 10000) / 100 : 0,
    }));

    const gradeTrendBySubject = new Map<string, { date: string; percent: number }[]>();
    for (const g of gradeEntries) {
      const percent = g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 10000) / 100 : 0;
      const key = enumToShared(g.subject);
      const list = gradeTrendBySubject.get(key) ?? [];
      list.push({ date: g.date.toISOString(), percent });
      gradeTrendBySubject.set(key, list);
    }

    const totalHabitLogs = habitLogs.length;
    const completedHabitLogs = habitLogs.filter((l) => l.completed).length;
    const habitCompletionRate = totalHabitLogs > 0 ? Math.round((completedHabitLogs / totalHabitLogs) * 10000) / 100 : 0;

    const stats: Record<string, unknown> = {
      goalsCompleted: businessGoalsCompleted + personalGoalsCompleted,
      totalStudyHours: Math.round((totalStudyMinutes / 60) * 100) / 100,
      totalReadingHours: Math.round((estimatedReadingMinutes / 60) * 100) / 100,
      quizScoreTrend,
      gradeTrend: Object.fromEntries(gradeTrendBySubject),
      habitCompletionRate,
      habitLogsTotal: totalHabitLogs,
      habitLogsCompleted: completedHabitLogs,
    };

    if (req.profile?.ownsBusiness) {
      const [revenue, expenses] = await Promise.all([
        prisma.revenueEntry.findMany({ where: { userId }, select: { amount: true, date: true } }),
        prisma.expenseEntry.findMany({ where: { userId }, select: { amount: true, date: true } }),
      ]);
      const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const byMonth = new Map<string, { revenue: number; expenses: number }>();
      for (const r of revenue) {
        const key = monthKey(r.date);
        const entry = byMonth.get(key) ?? { revenue: 0, expenses: 0 };
        entry.revenue += r.amount;
        byMonth.set(key, entry);
      }
      for (const e of expenses) {
        const key = monthKey(e.date);
        const entry = byMonth.get(key) ?? { revenue: 0, expenses: 0 };
        entry.expenses += e.amount;
        byMonth.set(key, entry);
      }
      stats.business = {
        byMonth: Array.from(byMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, agg]) => ({
            month,
            revenue: agg.revenue,
            expenses: agg.expenses,
            profit: agg.revenue - agg.expenses,
          })),
      };
    }

    res.json(stats);
  })
);

export default router;
