import { Router } from "express";
import { z } from "zod";
import type {
  Academy as PrismaAcademy,
  BudgetPeriod,
  MarketingStatus,
  CareerCategory,
} from "@prisma/client";
import { XP_REWARDS, COIN_REWARDS } from "@organizer/shared";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
import { enumToShared, sharedToEnum } from "../utils/serialize";
import { awardXp, checkBadgeAfterAcademyModule, checkBadgeAfterGoalCompleted } from "../services/gamification";
import { runAiChat } from "../services/aiChat";

const router = Router();

const ACADEMY_VALUES = [
  "marketing",
  "branding",
  "sales",
  "leadership",
  "investing",
  "app_development_replit",
  "ai_app_development",
] as const;

const CAREER_CATEGORY_VALUES = [
  "career_planning",
  "productivity",
  "time_management",
  "professional_development",
  "leadership",
  "goal_tracking",
] as const;

const BUDGET_PERIOD_VALUES = ["weekly", "monthly", "yearly"] as const;
const MARKETING_STATUS_VALUES = ["planned", "in_progress", "done"] as const;

// ---------- Revenue ----------

const revenueSchema = z.object({
  amount: z.number(),
  currency: z.string().trim().min(1).max(10),
  source: z.string().trim().min(1).max(200),
  date: z.string().min(1).optional(),
});

router.get(
  "/revenue",
  requireAuth,
  asyncHandler(async (req, res) => {
    const entries = await prisma.revenueEntry.findMany({
      where: { userId: req.user!.id },
      orderBy: { date: "desc" },
    });
    res.json({
      revenue: entries.map((e) => ({
        id: e.id,
        userId: e.userId,
        amount: e.amount,
        currency: e.currency,
        source: e.source,
        date: e.date.toISOString(),
      })),
    });
  })
);

router.post(
  "/revenue",
  requireAuth,
  validateBody(revenueSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof revenueSchema>;
    const entry = await prisma.revenueEntry.create({
      data: {
        userId: req.user!.id,
        amount: input.amount,
        currency: input.currency,
        source: input.source,
        date: input.date ? new Date(input.date) : new Date(),
      },
    });
    res.status(201).json({
      revenue: {
        id: entry.id,
        userId: entry.userId,
        amount: entry.amount,
        currency: entry.currency,
        source: entry.source,
        date: entry.date.toISOString(),
      },
    });
  })
);

router.patch(
  "/revenue/:id",
  requireAuth,
  validateBody(revenueSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.revenueEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Revenue entry not found");
    const input = req.body as Partial<z.infer<typeof revenueSchema>>;
    const updated = await prisma.revenueEntry.update({
      where: { id: existing.id },
      data: {
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.source !== undefined ? { source: input.source } : {}),
        ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
      },
    });
    res.json({
      revenue: {
        id: updated.id,
        userId: updated.userId,
        amount: updated.amount,
        currency: updated.currency,
        source: updated.source,
        date: updated.date.toISOString(),
      },
    });
  })
);

router.delete(
  "/revenue/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.revenueEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Revenue entry not found");
    await prisma.revenueEntry.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Expenses ----------

const expenseSchema = z.object({
  amount: z.number(),
  currency: z.string().trim().min(1).max(10),
  category: z.string().trim().min(1).max(200),
  date: z.string().min(1).optional(),
});

router.get(
  "/expenses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const entries = await prisma.expenseEntry.findMany({
      where: { userId: req.user!.id },
      orderBy: { date: "desc" },
    });
    res.json({
      expenses: entries.map((e) => ({
        id: e.id,
        userId: e.userId,
        amount: e.amount,
        currency: e.currency,
        category: e.category,
        date: e.date.toISOString(),
      })),
    });
  })
);

router.post(
  "/expenses",
  requireAuth,
  validateBody(expenseSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof expenseSchema>;
    const entry = await prisma.expenseEntry.create({
      data: {
        userId: req.user!.id,
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        date: input.date ? new Date(input.date) : new Date(),
      },
    });
    res.status(201).json({
      expense: {
        id: entry.id,
        userId: entry.userId,
        amount: entry.amount,
        currency: entry.currency,
        category: entry.category,
        date: entry.date.toISOString(),
      },
    });
  })
);

router.patch(
  "/expenses/:id",
  requireAuth,
  validateBody(expenseSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.expenseEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Expense entry not found");
    const input = req.body as Partial<z.infer<typeof expenseSchema>>;
    const updated = await prisma.expenseEntry.update({
      where: { id: existing.id },
      data: {
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
      },
    });
    res.json({
      expense: {
        id: updated.id,
        userId: updated.userId,
        amount: updated.amount,
        currency: updated.currency,
        category: updated.category,
        date: updated.date.toISOString(),
      },
    });
  })
);

router.delete(
  "/expenses/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.expenseEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Expense entry not found");
    await prisma.expenseEntry.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

/** GET /overview - totals, profit, and a month-by-month revenue/expense/profit breakdown. */
router.get(
  "/overview",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [revenue, expenses] = await Promise.all([
      prisma.revenueEntry.findMany({ where: { userId: req.user!.id } }),
      prisma.expenseEntry.findMany({ where: { userId: req.user!.id } }),
    ]);

    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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

    const months = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, agg]) => ({
        month,
        revenue: agg.revenue,
        expenses: agg.expenses,
        profit: agg.revenue - agg.expenses,
      }));

    res.json({
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      byMonth: months,
    });
  })
);

// ---------- Budgets ----------

const budgetSchema = z.object({
  category: z.string().trim().min(1).max(200),
  limit: z.number().positive(),
  currency: z.string().trim().min(1).max(10),
  period: z.enum(BUDGET_PERIOD_VALUES).optional(),
});

router.get(
  "/budgets",
  requireAuth,
  asyncHandler(async (req, res) => {
    const budgets = await prisma.budget.findMany({ where: { userId: req.user!.id } });
    res.json({
      budgets: budgets.map((b) => ({
        id: b.id,
        userId: b.userId,
        category: b.category,
        limit: b.limit,
        currency: b.currency,
        period: enumToShared(b.period),
      })),
    });
  })
);

router.post(
  "/budgets",
  requireAuth,
  validateBody(budgetSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof budgetSchema>;
    const budget = await prisma.budget.create({
      data: {
        userId: req.user!.id,
        category: input.category,
        limit: input.limit,
        currency: input.currency,
        period: input.period ? sharedToEnum<BudgetPeriod>(input.period) : "MONTHLY",
      },
    });
    res.status(201).json({
      budget: {
        id: budget.id,
        userId: budget.userId,
        category: budget.category,
        limit: budget.limit,
        currency: budget.currency,
        period: enumToShared(budget.period),
      },
    });
  })
);

router.patch(
  "/budgets/:id",
  requireAuth,
  validateBody(budgetSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Budget not found");
    const input = req.body as Partial<z.infer<typeof budgetSchema>>;
    const updated = await prisma.budget.update({
      where: { id: existing.id },
      data: {
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.limit !== undefined ? { limit: input.limit } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.period !== undefined ? { period: sharedToEnum<BudgetPeriod>(input.period) } : {}),
      },
    });
    res.json({
      budget: {
        id: updated.id,
        userId: updated.userId,
        category: updated.category,
        limit: updated.limit,
        currency: updated.currency,
        period: enumToShared(updated.period),
      },
    });
  })
);

router.delete(
  "/budgets/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Budget not found");
    await prisma.budget.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Business goals ----------

const businessGoalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  targetValue: z.number(),
  currentValue: z.number().optional(),
  unit: z.string().trim().min(1).max(50),
  dueDate: z.string().min(1).optional(),
});

function serializeBusinessGoal(g: {
  id: string;
  userId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate: Date | null;
  completed: boolean;
}) {
  return {
    id: g.id,
    userId: g.userId,
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
    const goals = await prisma.businessGoal.findMany({ where: { userId: req.user!.id } });
    res.json({ goals: goals.map(serializeBusinessGoal) });
  })
);

router.post(
  "/goals",
  requireAuth,
  validateBody(businessGoalSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof businessGoalSchema>;
    const goal = await prisma.businessGoal.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        targetValue: input.targetValue,
        currentValue: input.currentValue ?? 0,
        unit: input.unit,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
    });
    res.status(201).json({ goal: serializeBusinessGoal(goal) });
  })
);

router.patch(
  "/goals/:id",
  requireAuth,
  validateBody(businessGoalSchema.partial().extend({ completed: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.businessGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Goal not found");
    const input = req.body as Partial<z.infer<typeof businessGoalSchema>> & { completed?: boolean };
    const wasCompleted = existing.completed;

    const updated = await prisma.businessGoal.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.targetValue !== undefined ? { targetValue: input.targetValue } : {}),
        ...(input.currentValue !== undefined ? { currentValue: input.currentValue } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.dueDate !== undefined ? { dueDate: new Date(input.dueDate) } : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
      },
    });

    if (!wasCompleted && updated.completed) {
      await awardXp(req.user!.id, XP_REWARDS.goalCompleted, "business_goal_completed", COIN_REWARDS.goalCompleted);
      await checkBadgeAfterGoalCompleted(req.user!.id);
    }

    res.json({ goal: serializeBusinessGoal(updated) });
  })
);

router.delete(
  "/goals/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.businessGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Goal not found");
    await prisma.businessGoal.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Investments ----------

const investmentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().trim().min(1).max(10),
  currentValue: z.number(),
  purchaseDate: z.string().min(1),
});

function serializeInvestment(i: {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  currentValue: number;
  purchaseDate: Date;
}) {
  return {
    id: i.id,
    userId: i.userId,
    name: i.name,
    amount: i.amount,
    currency: i.currency,
    currentValue: i.currentValue,
    purchaseDate: i.purchaseDate.toISOString(),
  };
}

router.get(
  "/investments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const investments = await prisma.investmentEntry.findMany({ where: { userId: req.user!.id } });
    res.json({ investments: investments.map(serializeInvestment) });
  })
);

router.post(
  "/investments",
  requireAuth,
  validateBody(investmentSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof investmentSchema>;
    const investment = await prisma.investmentEntry.create({
      data: {
        userId: req.user!.id,
        name: input.name,
        amount: input.amount,
        currency: input.currency,
        currentValue: input.currentValue,
        purchaseDate: new Date(input.purchaseDate),
      },
    });
    res.status(201).json({ investment: serializeInvestment(investment) });
  })
);

router.patch(
  "/investments/:id",
  requireAuth,
  validateBody(investmentSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.investmentEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Investment not found");
    const input = req.body as Partial<z.infer<typeof investmentSchema>>;
    const updated = await prisma.investmentEntry.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.currentValue !== undefined ? { currentValue: input.currentValue } : {}),
        ...(input.purchaseDate !== undefined ? { purchaseDate: new Date(input.purchaseDate) } : {}),
      },
    });
    res.json({ investment: serializeInvestment(updated) });
  })
);

router.delete(
  "/investments/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.investmentEntry.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Investment not found");
    await prisma.investmentEntry.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

/** GET /investments/summary - gain/loss per investment and in aggregate. */
router.get(
  "/investments/summary",
  requireAuth,
  asyncHandler(async (req, res) => {
    const investments = await prisma.investmentEntry.findMany({ where: { userId: req.user!.id } });
    const items = investments.map((i) => {
      const gain = i.currentValue - i.amount;
      const gainPercent = i.amount > 0 ? (gain / i.amount) * 100 : 0;
      return {
        id: i.id,
        name: i.name,
        amount: i.amount,
        currentValue: i.currentValue,
        gain,
        gainPercent: Math.round(gainPercent * 100) / 100,
      };
    });
    const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
    const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    res.json({
      items,
      totalInvested,
      totalCurrentValue,
      totalGain: totalCurrentValue - totalInvested,
    });
  })
);

// ---------- Marketing plan ----------

const marketingSchema = z.object({
  title: z.string().trim().min(1).max(200),
  channel: z.string().trim().min(1).max(120),
  scheduledDate: z.string().min(1),
  status: z.enum(MARKETING_STATUS_VALUES).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function serializeMarketingItem(m: {
  id: string;
  userId: string;
  title: string;
  channel: string;
  scheduledDate: Date;
  status: string;
  notes: string | null;
}) {
  return {
    id: m.id,
    userId: m.userId,
    title: m.title,
    channel: m.channel,
    scheduledDate: m.scheduledDate.toISOString(),
    status: enumToShared(m.status),
    notes: m.notes,
  };
}

router.get(
  "/marketing",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await prisma.marketingPlanItem.findMany({
      where: { userId: req.user!.id },
      orderBy: { scheduledDate: "asc" },
    });
    res.json({ marketingItems: items.map(serializeMarketingItem) });
  })
);

router.post(
  "/marketing",
  requireAuth,
  validateBody(marketingSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof marketingSchema>;
    const item = await prisma.marketingPlanItem.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        channel: input.channel,
        scheduledDate: new Date(input.scheduledDate),
        status: input.status ? sharedToEnum<MarketingStatus>(input.status) : "PLANNED",
        notes: input.notes ?? null,
      },
    });
    res.status(201).json({ marketingItem: serializeMarketingItem(item) });
  })
);

router.patch(
  "/marketing/:id",
  requireAuth,
  validateBody(marketingSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.marketingPlanItem.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Marketing item not found");
    const input = req.body as Partial<z.infer<typeof marketingSchema>>;
    const updated = await prisma.marketingPlanItem.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.channel !== undefined ? { channel: input.channel } : {}),
        ...(input.scheduledDate !== undefined ? { scheduledDate: new Date(input.scheduledDate) } : {}),
        ...(input.status !== undefined ? { status: sharedToEnum<MarketingStatus>(input.status) } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    res.json({ marketingItem: serializeMarketingItem(updated) });
  })
);

router.delete(
  "/marketing/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.marketingPlanItem.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Marketing item not found");
    await prisma.marketingPlanItem.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Academies ----------

router.get("/academies", requireAuth, (_req, res) => {
  res.json({ academies: ACADEMY_VALUES });
});

router.get(
  "/academies/:key/modules",
  requireAuth,
  asyncHandler(async (req, res) => {
    const key = req.params.key;
    if (!ACADEMY_VALUES.includes(key as (typeof ACADEMY_VALUES)[number])) {
      throw HttpError.badRequest("Unknown academy key");
    }
    const academy = sharedToEnum<PrismaAcademy>(key);
    const [modules, progress] = await Promise.all([
      prisma.academyModule.findMany({ where: { academy }, orderBy: { order: "asc" } }),
      prisma.academyProgress.findMany({ where: { userId: req.user!.id, academy } }),
    ]);
    const progressByModule = new Map(progress.map((p) => [p.moduleId, p]));
    res.json({
      modules: modules.map((m) => ({
        id: m.id,
        academy: enumToShared(m.academy),
        title: m.title,
        summary: m.summary,
        order: m.order,
        completed: progressByModule.get(m.id)?.completed ?? false,
        completedAt: progressByModule.get(m.id)?.completedAt?.toISOString() ?? null,
      })),
    });
  })
);

router.post(
  "/academies/:key/modules/:moduleId/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const key = req.params.key;
    if (!ACADEMY_VALUES.includes(key as (typeof ACADEMY_VALUES)[number])) {
      throw HttpError.badRequest("Unknown academy key");
    }
    const academy = sharedToEnum<PrismaAcademy>(key);
    const module = await prisma.academyModule.findUnique({ where: { id: req.params.moduleId } });
    if (!module || module.academy !== academy) throw HttpError.notFound("Academy module not found");

    const progress = await prisma.academyProgress.upsert({
      where: { userId_moduleId: { userId: req.user!.id, moduleId: module.id } },
      create: {
        userId: req.user!.id,
        academy,
        moduleId: module.id,
        completed: true,
        completedAt: new Date(),
      },
      update: { completed: true, completedAt: new Date() },
    });

    await awardXp(req.user!.id, XP_REWARDS.homeworkCompleted, "academy_module_completed");
    await checkBadgeAfterAcademyModule(req.user!.id, academy);

    res.json({
      progress: {
        userId: progress.userId,
        academy: enumToShared(progress.academy),
        moduleId: progress.moduleId,
        completed: progress.completed,
        completedAt: progress.completedAt ? progress.completedAt.toISOString() : null,
      },
    });
  })
);

// ---------- Career goals (employee / non-owner track) ----------

const careerGoalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(CAREER_CATEGORY_VALUES),
  targetDate: z.string().min(1).optional(),
});

function serializeCareerGoal(g: {
  id: string;
  userId: string;
  title: string;
  category: string;
  targetDate: Date | null;
  completed: boolean;
}) {
  return {
    id: g.id,
    userId: g.userId,
    title: g.title,
    category: enumToShared(g.category),
    targetDate: g.targetDate ? g.targetDate.toISOString() : null,
    completed: g.completed,
  };
}

router.get(
  "/career-goals",
  requireAuth,
  asyncHandler(async (req, res) => {
    const goals = await prisma.careerGoal.findMany({ where: { userId: req.user!.id } });
    res.json({ careerGoals: goals.map(serializeCareerGoal) });
  })
);

router.post(
  "/career-goals",
  requireAuth,
  validateBody(careerGoalSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof careerGoalSchema>;
    const goal = await prisma.careerGoal.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        category: sharedToEnum<CareerCategory>(input.category),
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
      },
    });
    res.status(201).json({ careerGoal: serializeCareerGoal(goal) });
  })
);

router.patch(
  "/career-goals/:id",
  requireAuth,
  validateBody(careerGoalSchema.partial().extend({ completed: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.careerGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Career goal not found");
    const input = req.body as Partial<z.infer<typeof careerGoalSchema>> & { completed?: boolean };
    const wasCompleted = existing.completed;
    const updated = await prisma.careerGoal.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.category !== undefined ? { category: sharedToEnum<CareerCategory>(input.category) } : {}),
        ...(input.targetDate !== undefined ? { targetDate: new Date(input.targetDate) } : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
      },
    });
    if (!wasCompleted && updated.completed) {
      await awardXp(req.user!.id, XP_REWARDS.goalCompleted, "career_goal_completed", COIN_REWARDS.goalCompleted);
    }
    res.json({ careerGoal: serializeCareerGoal(updated) });
  })
);

router.delete(
  "/career-goals/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.careerGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Career goal not found");
    await prisma.careerGoal.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Business coach chat ----------

const coachChatSchema = z.object({
  conversationId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(4000),
});

router.post(
  "/coach/chat",
  requireAuth,
  validateBody(coachChatSchema),
  asyncHandler(async (req, res) => {
    const { conversationId, message } = req.body as z.infer<typeof coachChatSchema>;
    const result = await runAiChat({
      userId: req.user!.id,
      profile: req.profile ?? null,
      conversationId,
      message,
      endpoint: "business.coach",
      extraSystemPrompt:
        "Frame every answer as a pragmatic business coach: focus on revenue, costs, growth " +
        "levers, and concrete next actions. When numbers are relevant, ask for or reference the " +
        "user's tracked revenue/expenses/goals in Organizer rather than inventing figures.",
    });
    res.json(result);
  })
);

export default router;
