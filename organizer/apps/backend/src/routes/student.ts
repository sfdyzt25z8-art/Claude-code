import { Router } from "express";
import { z } from "zod";
import { SUBJECTS, XP_REWARDS, COIN_REWARDS } from "@organizer/shared";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
import { enumToShared, sharedToEnum } from "../utils/serialize";
import {
  awardXp,
  checkBadgeAfterHomework,
  checkBadgeAfterStudySession,
  checkBadgesAfterQuiz,
  updateStreak,
} from "../services/gamification";
import { assembleAdaptiveQuiz, buildQuizRecommendation } from "../services/quizBank";
import type { Subject, ReadingStatus, Difficulty, MiniGame } from "@prisma/client";

const router = Router();

const SUBJECT_VALUES = [
  "math",
  "science",
  "english",
  "geography",
  "history",
  "computer_science",
  "business",
  "economics",
] as const;
const subjectSchema = z.enum(SUBJECT_VALUES);

const MINI_GAME_VALUES = [
  "memory_challenge",
  "focus_challenge",
  "sudoku",
  "logic_puzzles",
  "vocabulary_games",
  "math_battle",
  "science_challenge",
] as const;

function serializeHomework(h: {
  id: string;
  userId: string;
  subject: string;
  title: string;
  description: string | null;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
}) {
  return {
    id: h.id,
    userId: h.userId,
    subject: enumToShared(h.subject),
    title: h.title,
    description: h.description,
    dueDate: h.dueDate.toISOString(),
    completed: h.completed,
    createdAt: h.createdAt.toISOString(),
  };
}

// ---------- Subjects ----------

router.get("/subjects", requireAuth, (_req, res) => {
  res.json({ subjects: SUBJECTS });
});

// ---------- Homework ----------

const homeworkCreateSchema = z.object({
  subject: subjectSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.string().datetime().or(z.string().min(1)),
});

const homeworkUpdateSchema = homeworkCreateSchema.partial().extend({
  completed: z.boolean().optional(),
});

router.get(
  "/homework",
  requireAuth,
  asyncHandler(async (req, res) => {
    const completed = req.query.completed;
    const where: { userId: string; completed?: boolean } = { userId: req.user!.id };
    if (completed === "true") where.completed = true;
    if (completed === "false") where.completed = false;
    const items = await prisma.homework.findMany({ where, orderBy: { dueDate: "asc" } });
    res.json({ homework: items.map(serializeHomework) });
  })
);

router.post(
  "/homework",
  requireAuth,
  validateBody(homeworkCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof homeworkCreateSchema>;
    const item = await prisma.homework.create({
      data: {
        userId: req.user!.id,
        subject: sharedToEnum<Subject>(input.subject),
        title: input.title,
        description: input.description ?? null,
        dueDate: new Date(input.dueDate),
      },
    });
    res.status(201).json({ homework: serializeHomework(item) });
  })
);

router.patch(
  "/homework/:id",
  requireAuth,
  validateBody(homeworkUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.homework.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Homework not found");
    const input = req.body as z.infer<typeof homeworkUpdateSchema>;
    const wasCompleted = existing.completed;

    const updated = await prisma.homework.update({
      where: { id: existing.id },
      data: {
        ...(input.subject !== undefined ? { subject: sharedToEnum<Subject>(input.subject) } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.dueDate !== undefined ? { dueDate: new Date(input.dueDate) } : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
      },
    });

    if (!wasCompleted && updated.completed) {
      await awardXp(req.user!.id, XP_REWARDS.homeworkCompleted, "homework_completed");
      await updateStreak(req.user!.id);
      await checkBadgeAfterHomework(req.user!.id);
    }

    res.json({ homework: serializeHomework(updated) });
  })
);

router.delete(
  "/homework/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.homework.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Homework not found");
    await prisma.homework.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Grades ----------

const gradeCreateSchema = z.object({
  subject: subjectSchema,
  assignmentName: z.string().trim().min(1).max(200),
  score: z.number().min(0),
  maxScore: z.number().positive(),
  weight: z.number().positive().optional(),
  date: z.string().min(1).optional(),
});

router.get(
  "/grades",
  requireAuth,
  asyncHandler(async (req, res) => {
    const subjectParam = req.query.subject;
    const isValidSubject =
      typeof subjectParam === "string" && SUBJECT_VALUES.includes(subjectParam as (typeof SUBJECT_VALUES)[number]);
    const grades = await prisma.gradeEntry.findMany({
      where: {
        userId: req.user!.id,
        ...(isValidSubject ? { subject: sharedToEnum<Subject>(subjectParam as string) } : {}),
      },
      orderBy: { date: "desc" },
    });
    res.json({
      grades: grades.map((g) => ({
        id: g.id,
        userId: g.userId,
        subject: enumToShared(g.subject),
        assignmentName: g.assignmentName,
        score: g.score,
        maxScore: g.maxScore,
        weight: g.weight,
        date: g.date.toISOString(),
      })),
    });
  })
);

router.post(
  "/grades",
  requireAuth,
  validateBody(gradeCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof gradeCreateSchema>;
    const grade = await prisma.gradeEntry.create({
      data: {
        userId: req.user!.id,
        subject: sharedToEnum<Subject>(input.subject),
        assignmentName: input.assignmentName,
        score: input.score,
        maxScore: input.maxScore,
        weight: input.weight ?? 1,
        date: input.date ? new Date(input.date) : new Date(),
      },
    });
    res.status(201).json({
      grade: {
        id: grade.id,
        userId: grade.userId,
        subject: enumToShared(grade.subject),
        assignmentName: grade.assignmentName,
        score: grade.score,
        maxScore: grade.maxScore,
        weight: grade.weight,
        date: grade.date.toISOString(),
      },
    });
  })
);

router.patch(
  "/grades/:id",
  requireAuth,
  validateBody(gradeCreateSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.gradeEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Grade not found");
    const input = req.body as Partial<z.infer<typeof gradeCreateSchema>>;
    const updated = await prisma.gradeEntry.update({
      where: { id: existing.id },
      data: {
        ...(input.subject !== undefined ? { subject: sharedToEnum<Subject>(input.subject) } : {}),
        ...(input.assignmentName !== undefined ? { assignmentName: input.assignmentName } : {}),
        ...(input.score !== undefined ? { score: input.score } : {}),
        ...(input.maxScore !== undefined ? { maxScore: input.maxScore } : {}),
        ...(input.weight !== undefined ? { weight: input.weight } : {}),
        ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
      },
    });
    res.json({
      grade: {
        id: updated.id,
        userId: updated.userId,
        subject: enumToShared(updated.subject),
        assignmentName: updated.assignmentName,
        score: updated.score,
        maxScore: updated.maxScore,
        weight: updated.weight,
        date: updated.date.toISOString(),
      },
    });
  })
);

router.delete(
  "/grades/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.gradeEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Grade not found");
    await prisma.gradeEntry.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

/** GET /grades/summary - weighted average percentage per subject. */
router.get(
  "/grades/summary",
  requireAuth,
  asyncHandler(async (req, res) => {
    const grades = await prisma.gradeEntry.findMany({ where: { userId: req.user!.id } });
    const bySubject = new Map<string, { weightedSum: number; totalWeight: number; count: number }>();

    for (const g of grades) {
      const key = g.subject;
      const percent = g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0;
      const entry = bySubject.get(key) ?? { weightedSum: 0, totalWeight: 0, count: 0 };
      entry.weightedSum += percent * g.weight;
      entry.totalWeight += g.weight;
      entry.count += 1;
      bySubject.set(key, entry);
    }

    const summary = Array.from(bySubject.entries()).map(([subject, agg]) => ({
      subject: enumToShared(subject),
      weightedAverage: agg.totalWeight > 0 ? Math.round((agg.weightedSum / agg.totalWeight) * 100) / 100 : 0,
      entryCount: agg.count,
    }));

    res.json({ summary });
  })
);

// ---------- Study plan ----------

const studyPlanCreateSchema = z.object({
  subject: subjectSchema,
  title: z.string().trim().min(1).max(200),
  scheduledAt: z.string().min(1),
  durationMinutes: z.number().int().positive().max(1440),
});

router.get(
  "/study-plan",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await prisma.studyPlanItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { scheduledAt: "asc" },
    });
    res.json({
      studyPlanItems: items.map((i) => ({
        id: i.id,
        userId: i.userId,
        subject: enumToShared(i.subject),
        title: i.title,
        scheduledAt: i.scheduledAt.toISOString(),
        durationMinutes: i.durationMinutes,
        completed: i.completed,
      })),
    });
  })
);

router.post(
  "/study-plan",
  requireAuth,
  validateBody(studyPlanCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof studyPlanCreateSchema>;
    const item = await prisma.studyPlanItem.create({
      data: {
        userId: req.user!.id,
        subject: sharedToEnum<Subject>(input.subject),
        title: input.title,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes,
      },
    });
    res.status(201).json({
      studyPlanItem: {
        id: item.id,
        userId: item.userId,
        subject: enumToShared(item.subject),
        title: item.title,
        scheduledAt: item.scheduledAt.toISOString(),
        durationMinutes: item.durationMinutes,
        completed: item.completed,
      },
    });
  })
);

router.patch(
  "/study-plan/:id",
  requireAuth,
  validateBody(studyPlanCreateSchema.partial().extend({ completed: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.studyPlanItem.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Study plan item not found");
    const input = req.body as Partial<z.infer<typeof studyPlanCreateSchema>> & { completed?: boolean };
    const updated = await prisma.studyPlanItem.update({
      where: { id: existing.id },
      data: {
        ...(input.subject !== undefined ? { subject: sharedToEnum<Subject>(input.subject) } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.scheduledAt !== undefined ? { scheduledAt: new Date(input.scheduledAt) } : {}),
        ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
      },
    });
    res.json({
      studyPlanItem: {
        id: updated.id,
        userId: updated.userId,
        subject: enumToShared(updated.subject),
        title: updated.title,
        scheduledAt: updated.scheduledAt.toISOString(),
        durationMinutes: updated.durationMinutes,
        completed: updated.completed,
      },
    });
  })
);

router.delete(
  "/study-plan/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.studyPlanItem.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Study plan item not found");
    await prisma.studyPlanItem.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Exams ----------

const examCreateSchema = z.object({
  subject: subjectSchema,
  title: z.string().trim().min(1).max(200),
  date: z.string().min(1),
  location: z.string().trim().max(200).optional(),
});

router.get(
  "/exams",
  requireAuth,
  asyncHandler(async (req, res) => {
    const exams = await prisma.exam.findMany({ where: { userId: req.user!.id }, orderBy: { date: "asc" } });
    res.json({
      exams: exams.map((e) => ({
        id: e.id,
        userId: e.userId,
        subject: enumToShared(e.subject),
        title: e.title,
        date: e.date.toISOString(),
        location: e.location,
      })),
    });
  })
);

/** GET /exams/countdown - upcoming exams (date >= now) sorted soonest-first with daysUntil. */
router.get(
  "/exams/countdown",
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: { userId: req.user!.id, date: { gte: now } },
      orderBy: { date: "asc" },
    });
    res.json({
      exams: exams.map((e) => ({
        id: e.id,
        userId: e.userId,
        subject: enumToShared(e.subject),
        title: e.title,
        date: e.date.toISOString(),
        location: e.location,
        daysUntil: Math.ceil((e.date.getTime() - now.getTime()) / 86_400_000),
      })),
    });
  })
);

router.post(
  "/exams",
  requireAuth,
  validateBody(examCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof examCreateSchema>;
    const exam = await prisma.exam.create({
      data: {
        userId: req.user!.id,
        subject: sharedToEnum<Subject>(input.subject),
        title: input.title,
        date: new Date(input.date),
        location: input.location ?? null,
      },
    });
    res.status(201).json({
      exam: {
        id: exam.id,
        userId: exam.userId,
        subject: enumToShared(exam.subject),
        title: exam.title,
        date: exam.date.toISOString(),
        location: exam.location,
      },
    });
  })
);

router.patch(
  "/exams/:id",
  requireAuth,
  validateBody(examCreateSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Exam not found");
    const input = req.body as Partial<z.infer<typeof examCreateSchema>>;
    const updated = await prisma.exam.update({
      where: { id: existing.id },
      data: {
        ...(input.subject !== undefined ? { subject: sharedToEnum<Subject>(input.subject) } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
      },
    });
    res.json({
      exam: {
        id: updated.id,
        userId: updated.userId,
        subject: enumToShared(updated.subject),
        title: updated.title,
        date: updated.date.toISOString(),
        location: updated.location,
      },
    });
  })
);

router.delete(
  "/exams/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Exam not found");
    await prisma.exam.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Reading ----------

const READING_STATUS_VALUES = ["reading", "completed", "wishlist"] as const;

const readingCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().max(200).optional(),
  totalPages: z.number().int().positive().optional(),
  status: z.enum(READING_STATUS_VALUES).optional(),
});

function serializeReading(r: {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  totalPages: number | null;
  pagesRead: number;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
}) {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    author: r.author,
    totalPages: r.totalPages,
    pagesRead: r.pagesRead,
    status: enumToShared(r.status),
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
  };
}

router.get(
  "/reading",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await prisma.readingEntry.findMany({ where: { userId: req.user!.id } });
    res.json({ reading: items.map(serializeReading) });
  })
);

router.post(
  "/reading",
  requireAuth,
  validateBody(readingCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof readingCreateSchema>;
    const item = await prisma.readingEntry.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        author: input.author ?? null,
        totalPages: input.totalPages ?? null,
        status: input.status ? sharedToEnum<ReadingStatus>(input.status) : "WISHLIST",
      },
    });
    res.status(201).json({ reading: serializeReading(item) });
  })
);

router.patch(
  "/reading/:id",
  requireAuth,
  validateBody(readingCreateSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.readingEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Reading entry not found");
    const input = req.body as Partial<z.infer<typeof readingCreateSchema>>;
    const updated = await prisma.readingEntry.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.author !== undefined ? { author: input.author } : {}),
        ...(input.totalPages !== undefined ? { totalPages: input.totalPages } : {}),
        ...(input.status !== undefined ? { status: sharedToEnum<ReadingStatus>(input.status) } : {}),
      },
    });
    res.json({ reading: serializeReading(updated) });
  })
);

/** PATCH /reading/:id/progress - updates pagesRead and auto-manages status/timestamps. */
router.patch(
  "/reading/:id/progress",
  requireAuth,
  validateBody(z.object({ pagesRead: z.number().int().min(0) })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.readingEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Reading entry not found");
    const { pagesRead } = req.body as { pagesRead: number };

    const now = new Date();
    const isNowComplete = existing.totalPages !== null && pagesRead >= existing.totalPages;
    const wasStarted = existing.status !== "WISHLIST";

    const updated = await prisma.readingEntry.update({
      where: { id: existing.id },
      data: {
        pagesRead,
        status: isNowComplete ? "COMPLETED" : pagesRead > 0 ? "READING" : existing.status,
        startedAt: !wasStarted && pagesRead > 0 ? now : existing.startedAt,
        finishedAt: isNowComplete ? now : existing.finishedAt,
      },
    });
    res.json({ reading: serializeReading(updated) });
  })
);

router.delete(
  "/reading/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.readingEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Reading entry not found");
    await prisma.readingEntry.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Study sessions ----------

router.get(
  "/study-sessions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessions = await prisma.studySession.findMany({
      where: { userId: req.user!.id },
      orderBy: { startedAt: "desc" },
    });
    res.json({
      studySessions: sessions.map((s) => ({
        id: s.id,
        userId: s.userId,
        subject: s.subject ? enumToShared(s.subject) : null,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt ? s.endedAt.toISOString() : null,
        durationMinutes: s.durationMinutes,
      })),
    });
  })
);

router.post(
  "/study-sessions/start",
  requireAuth,
  validateBody(z.object({ subject: subjectSchema.optional() })),
  asyncHandler(async (req, res) => {
    const { subject } = req.body as { subject?: z.infer<typeof subjectSchema> };
    const session = await prisma.studySession.create({
      data: { userId: req.user!.id, subject: subject ? sharedToEnum<Subject>(subject) : null },
    });
    res.status(201).json({
      studySession: {
        id: session.id,
        userId: session.userId,
        subject: session.subject ? enumToShared(session.subject) : null,
        startedAt: session.startedAt.toISOString(),
        endedAt: null,
        durationMinutes: session.durationMinutes,
      },
    });
  })
);

router.post(
  "/study-sessions/:id/end",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.studySession.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Study session not found");
    if (existing.endedAt) throw HttpError.badRequest("Study session already ended");

    const endedAt = new Date();
    const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - existing.startedAt.getTime()) / 60_000));

    const updated = await prisma.studySession.update({
      where: { id: existing.id },
      data: { endedAt, durationMinutes },
    });

    await awardXp(req.user!.id, XP_REWARDS.studySessionCompleted, "study_session_completed");
    await updateStreak(req.user!.id);
    await checkBadgeAfterStudySession(req.user!.id);

    res.json({
      studySession: {
        id: updated.id,
        userId: updated.userId,
        subject: updated.subject ? enumToShared(updated.subject) : null,
        startedAt: updated.startedAt.toISOString(),
        endedAt: updated.endedAt ? updated.endedAt.toISOString() : null,
        durationMinutes: updated.durationMinutes,
      },
    });
  })
);

// ---------- Quizzes ----------

router.post(
  "/quizzes",
  requireAuth,
  validateBody(z.object({ subject: subjectSchema })),
  asyncHandler(async (req, res) => {
    const { subject } = req.body as { subject: z.infer<typeof subjectSchema> };
    const questions = await assembleAdaptiveQuiz(req.user!.id, subject, 15);

    const quiz = await prisma.quiz.create({
      data: {
        userId: req.user!.id,
        subject: sharedToEnum<Subject>(subject),
        questions: {
          create: questions.map((q, index) => ({
            prompt: q.prompt,
            choices: q.choices,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            difficulty: sharedToEnum<Difficulty>(q.difficulty),
            order: index,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    res.status(201).json({
      quiz: {
        id: quiz.id,
        userId: quiz.userId,
        subject: enumToShared(quiz.subject),
        createdAt: quiz.createdAt.toISOString(),
        questions: quiz.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          choices: q.choices,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          difficulty: enumToShared(q.difficulty),
        })),
      },
    });
  })
);

router.post(
  "/quizzes/:id/submit",
  requireAuth,
  validateBody(z.object({ answers: z.array(z.number().int().min(0)) })),
  asyncHandler(async (req, res) => {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!quiz || quiz.userId !== req.user!.id) throw HttpError.notFound("Quiz not found");

    const { answers } = req.body as { answers: number[] };
    if (answers.length !== quiz.questions.length) {
      throw HttpError.badRequest(
        `Expected ${quiz.questions.length} answers, received ${answers.length}`
      );
    }

    const score = quiz.questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const totalQuestions = quiz.questions.length;
    const percent = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const isPerfect = score === totalQuestions;

    const attempt = await prisma.quizAttempt.create({
      data: { quizId: quiz.id, userId: req.user!.id, answers, score, totalQuestions },
    });

    await awardXp(
      req.user!.id,
      XP_REWARDS.quizCompleted + (isPerfect ? XP_REWARDS.perfectQuiz : 0),
      "quiz_completed",
      COIN_REWARDS.quizCompleted + (isPerfect ? COIN_REWARDS.perfectQuiz : 0)
    );
    await updateStreak(req.user!.id);
    await checkBadgesAfterQuiz(req.user!.id, percent);

    const recommendation = buildQuizRecommendation(enumToShared(quiz.subject), percent);

    res.json({
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        userId: attempt.userId,
        answers: attempt.answers,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        completedAt: attempt.completedAt.toISOString(),
      },
      correctAnswers: quiz.questions.map((q) => q.correctIndex),
      explanations: quiz.questions.map((q) => q.explanation),
      scorePercent: Math.round(percent * 100) / 100,
      recommendation,
    });
  })
);

// ---------- Mini games ----------

router.post(
  "/mini-games/scores",
  requireAuth,
  validateBody(z.object({ game: z.enum(MINI_GAME_VALUES), score: z.number().int().min(0) })),
  asyncHandler(async (req, res) => {
    const { game, score } = req.body as { game: (typeof MINI_GAME_VALUES)[number]; score: number };
    const entry = await prisma.miniGameScore.create({
      data: { userId: req.user!.id, game: sharedToEnum<MiniGame>(game), score },
    });
    await awardXp(req.user!.id, XP_REWARDS.miniGamePlayed, "mini_game_played");
    await updateStreak(req.user!.id);
    res.status(201).json({
      miniGameScore: {
        id: entry.id,
        userId: entry.userId,
        game: enumToShared(entry.game),
        score: entry.score,
        playedAt: entry.playedAt.toISOString(),
      },
    });
  })
);

router.get(
  "/mini-games/leaderboard",
  requireAuth,
  asyncHandler(async (req, res) => {
    const gameParam = req.query.game;
    const games =
      typeof gameParam === "string" && MINI_GAME_VALUES.includes(gameParam as (typeof MINI_GAME_VALUES)[number])
        ? [gameParam as (typeof MINI_GAME_VALUES)[number]]
        : MINI_GAME_VALUES;

    const leaderboard: Record<string, unknown[]> = {};
    for (const game of games) {
      const topScores = await prisma.miniGameScore.findMany({
        where: { game: sharedToEnum<MiniGame>(game) },
        orderBy: { score: "desc" },
        take: gameParam ? 10 : 5,
        include: { user: { include: { profile: true } } },
      });
      leaderboard[game] = topScores.map((s) => ({
        userId: s.userId,
        name: s.user.profile?.name ?? "Anonymous",
        score: s.score,
        playedAt: s.playedAt.toISOString(),
      }));
    }

    res.json({ leaderboard });
  })
);

export default router;
