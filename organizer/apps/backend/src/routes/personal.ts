import { Router } from "express";
import { z } from "zod";
import { PERSONAL_FOCUS_OPTIONS, XP_REWARDS, COIN_REWARDS } from "@organizer/shared";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
import { enumToShared, sharedToEnum } from "../utils/serialize";
import { awardXp, checkBadgeAfterGoalCompleted, checkBadgeAfterHabitLog, updateStreak } from "../services/gamification";
import type { PersonalFocus, HabitFrequency } from "@prisma/client";

const router = Router();

const PERSONAL_FOCUS_VALUES = [
  "lose_weight",
  "gain_muscle",
  "fitness",
  "productivity",
  "habits",
  "reading",
  "mental_wellness",
  "learning_skills",
] as const;

const HABIT_FREQUENCY_VALUES = ["daily", "weekly"] as const;

router.get("/focus-options", requireAuth, (_req, res) => {
  res.json({ focusOptions: PERSONAL_FOCUS_OPTIONS });
});

// ---------- Personal goals ----------

const personalGoalSchema = z.object({
  focus: z.enum(PERSONAL_FOCUS_VALUES),
  title: z.string().trim().min(1).max(200),
  targetValue: z.number().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  unit: z.string().trim().max(50).nullable().optional(),
  dueDate: z.string().min(1).nullable().optional(),
});

function serializePersonalGoal(g: {
  id: string;
  userId: string;
  focus: string;
  title: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  dueDate: Date | null;
  completed: boolean;
}) {
  return {
    id: g.id,
    userId: g.userId,
    focus: enumToShared(g.focus),
    title: g.title,
    targetValue: g.targetValue,
    currentValue: g.currentValue,
    unit: g.unit,
    dueDate: g.dueDate ? g.dueDate.toISOString() : null,
    completed: g.completed,
  };
}

router.get(
  "/goals",
  requireAuth,
  asyncHandler(async (req, res) => {
    const goals = await prisma.personalGoal.findMany({ where: { userId: req.user!.id } });
    res.json({ goals: goals.map(serializePersonalGoal) });
  })
);

router.post(
  "/goals",
  requireAuth,
  validateBody(personalGoalSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof personalGoalSchema>;
    const goal = await prisma.personalGoal.create({
      data: {
        userId: req.user!.id,
        focus: sharedToEnum<PersonalFocus>(input.focus),
        title: input.title,
        targetValue: input.targetValue ?? null,
        currentValue: input.currentValue ?? null,
        unit: input.unit ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
    });
    res.status(201).json({ goal: serializePersonalGoal(goal) });
  })
);

router.patch(
  "/goals/:id",
  requireAuth,
  validateBody(personalGoalSchema.partial().extend({ completed: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.personalGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Goal not found");
    const input = req.body as Partial<z.infer<typeof personalGoalSchema>> & { completed?: boolean };
    const wasCompleted = existing.completed;

    const updated = await prisma.personalGoal.update({
      where: { id: existing.id },
      data: {
        ...(input.focus !== undefined ? { focus: sharedToEnum<PersonalFocus>(input.focus) } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.targetValue !== undefined ? { targetValue: input.targetValue } : {}),
        ...(input.currentValue !== undefined ? { currentValue: input.currentValue } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
      },
    });

    if (!wasCompleted && updated.completed) {
      await awardXp(req.user!.id, XP_REWARDS.goalCompleted, "personal_goal_completed", COIN_REWARDS.goalCompleted);
      await checkBadgeAfterGoalCompleted(req.user!.id);
    }

    res.json({ goal: serializePersonalGoal(updated) });
  })
);

router.delete(
  "/goals/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.personalGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Goal not found");
    await prisma.personalGoal.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Habits ----------

const habitSchema = z.object({
  title: z.string().trim().min(1).max(200),
  focus: z.enum(PERSONAL_FOCUS_VALUES).nullable().optional(),
  frequency: z.enum(HABIT_FREQUENCY_VALUES).optional(),
  targetCount: z.number().int().positive().optional(),
});

function serializeHabit(h: {
  id: string;
  userId: string;
  title: string;
  focus: string | null;
  frequency: string;
  targetCount: number;
  createdAt: Date;
  archived: boolean;
}) {
  return {
    id: h.id,
    userId: h.userId,
    title: h.title,
    focus: h.focus ? enumToShared(h.focus) : null,
    frequency: enumToShared(h.frequency),
    targetCount: h.targetCount,
    createdAt: h.createdAt.toISOString(),
    archived: h.archived,
  };
}

router.get(
  "/habits",
  requireAuth,
  asyncHandler(async (req, res) => {
    const includeArchived = req.query.includeArchived === "true";
    const habits = await prisma.habit.findMany({
      where: { userId: req.user!.id, ...(includeArchived ? {} : { archived: false }) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ habits: habits.map(serializeHabit) });
  })
);

router.post(
  "/habits",
  requireAuth,
  validateBody(habitSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof habitSchema>;
    const habit = await prisma.habit.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        focus: input.focus ? sharedToEnum<PersonalFocus>(input.focus) : null,
        frequency: input.frequency ? sharedToEnum<HabitFrequency>(input.frequency) : "DAILY",
        targetCount: input.targetCount ?? 1,
      },
    });
    res.status(201).json({ habit: serializeHabit(habit) });
  })
);

router.patch(
  "/habits/:id",
  requireAuth,
  validateBody(habitSchema.partial().extend({ archived: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.habit.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Habit not found");
    const input = req.body as Partial<z.infer<typeof habitSchema>> & { archived?: boolean };
    const updated = await prisma.habit.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.focus !== undefined ? { focus: input.focus ? sharedToEnum<PersonalFocus>(input.focus) : null } : {}),
        ...(input.frequency !== undefined ? { frequency: sharedToEnum<HabitFrequency>(input.frequency) } : {}),
        ...(input.targetCount !== undefined ? { targetCount: input.targetCount } : {}),
        ...(input.archived !== undefined ? { archived: input.archived } : {}),
      },
    });
    res.json({ habit: serializeHabit(updated) });
  })
);

router.delete(
  "/habits/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.habit.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Habit not found");
    await prisma.habit.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

/** POST /habits/:id/log - creates a HabitLog, awards XP, updates the user's streak. */
router.post(
  "/habits/:id/log",
  requireAuth,
  validateBody(z.object({ completed: z.boolean().optional(), date: z.string().min(1).optional() })),
  asyncHandler(async (req, res) => {
    const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
    if (!habit || habit.userId !== req.user!.id) throw HttpError.notFound("Habit not found");
    const input = req.body as { completed?: boolean; date?: string };

    const log = await prisma.habitLog.create({
      data: {
        habitId: habit.id,
        userId: req.user!.id,
        completed: input.completed ?? true,
        date: input.date ? new Date(input.date) : new Date(),
      },
    });

    if (log.completed) {
      await awardXp(req.user!.id, XP_REWARDS.habitLogged, "habit_logged", COIN_REWARDS.habitLogged);
      await updateStreak(req.user!.id);
      await checkBadgeAfterHabitLog(req.user!.id);
    }

    res.status(201).json({
      habitLog: {
        id: log.id,
        habitId: log.habitId,
        userId: log.userId,
        date: log.date.toISOString(),
        completed: log.completed,
      },
    });
  })
);

// ---------- Progress check-ins ----------

const checkInSchema = z.object({
  focus: z.enum(PERSONAL_FOCUS_VALUES),
  value: z.number(),
  date: z.string().min(1).optional(),
  note: z.string().trim().max(1000).optional(),
});

function serializeCheckIn(c: {
  id: string;
  userId: string;
  focus: string;
  date: Date;
  value: number;
  note: string | null;
}) {
  return {
    id: c.id,
    userId: c.userId,
    focus: enumToShared(c.focus),
    date: c.date.toISOString(),
    value: c.value,
    note: c.note,
  };
}

router.get(
  "/check-ins",
  requireAuth,
  asyncHandler(async (req, res) => {
    const checkIns = await prisma.progressCheckIn.findMany({
      where: { userId: req.user!.id },
      orderBy: { date: "desc" },
    });
    res.json({ checkIns: checkIns.map(serializeCheckIn) });
  })
);

router.post(
  "/check-ins",
  requireAuth,
  validateBody(checkInSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof checkInSchema>;
    const checkIn = await prisma.progressCheckIn.create({
      data: {
        userId: req.user!.id,
        focus: sharedToEnum<PersonalFocus>(input.focus),
        value: input.value,
        date: input.date ? new Date(input.date) : new Date(),
        note: input.note ?? null,
      },
    });
    res.status(201).json({ checkIn: serializeCheckIn(checkIn) });
  })
);

router.patch(
  "/check-ins/:id",
  requireAuth,
  validateBody(checkInSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.progressCheckIn.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Check-in not found");
    const input = req.body as Partial<z.infer<typeof checkInSchema>>;
    const updated = await prisma.progressCheckIn.update({
      where: { id: existing.id },
      data: {
        ...(input.focus !== undefined ? { focus: sharedToEnum<PersonalFocus>(input.focus) } : {}),
        ...(input.value !== undefined ? { value: input.value } : {}),
        ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
      },
    });
    res.json({ checkIn: serializeCheckIn(updated) });
  })
);

router.delete(
  "/check-ins/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.progressCheckIn.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Check-in not found");
    await prisma.progressCheckIn.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
