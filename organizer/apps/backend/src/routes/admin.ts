import { Router } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
import { enumToShared, sharedToEnum } from "../utils/serialize";
import type { Role, Academy, Subject } from "@prisma/client";

const router = Router();

router.use(requireAuth, requireAdmin);

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

const ACADEMY_VALUES = [
  "marketing",
  "branding",
  "sales",
  "leadership",
  "investing",
  "app_development_replit",
  "ai_app_development",
] as const;

// ---------- User management ----------

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize ?? "20"), 10) || 20));
    const search = typeof req.query.query === "string" ? req.query.query.trim() : "";

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { profile: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: { profile: true, gamification: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      total,
      page,
      pageSize,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.profile?.name ?? null,
        mode: u.profile?.mode ? enumToShared(u.profile.mode) : null,
        role: enumToShared<"user" | "admin">(u.role),
        createdAt: u.createdAt.toISOString(),
        lastActiveAt: u.gamification?.lastActivityDate?.toISOString() ?? null,
        suspended: u.suspended,
      })),
    });
  })
);

router.patch(
  "/users/:id/suspend",
  validateBody(z.object({ suspended: z.boolean() })),
  asyncHandler(async (req, res) => {
    const { suspended } = req.body as { suspended: boolean };
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw HttpError.notFound("User not found");
    const updated = await prisma.user.update({ where: { id: user.id }, data: { suspended } });
    res.json({ user: { id: updated.id, email: updated.email, suspended: updated.suspended } });
  })
);

router.patch(
  "/users/:id/role",
  validateBody(z.object({ role: z.enum(["user", "admin"]) })),
  asyncHandler(async (req, res) => {
    const { role } = req.body as { role: "user" | "admin" };
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw HttpError.notFound("User not found");
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: sharedToEnum<Role>(role) },
    });
    res.json({ user: { id: updated.id, email: updated.email, role: enumToShared(updated.role) } });
  })
);

// ---------- Courses ----------

const courseSchema = z.object({
  title: z.string().trim().min(1).max(200),
  academy: z.enum(ACADEMY_VALUES).nullable().optional(),
  subject: z.enum(SUBJECT_VALUES).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  published: z.boolean().optional(),
});

function serializeCourse(c: {
  id: string;
  title: string;
  academy: string | null;
  subject: string | null;
  description: string | null;
  published: boolean;
  createdAt: Date;
}) {
  return {
    id: c.id,
    title: c.title,
    academy: c.academy ? enumToShared(c.academy) : null,
    subject: c.subject ? enumToShared(c.subject) : null,
    description: c.description,
    published: c.published,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get(
  "/courses",
  asyncHandler(async (_req, res) => {
    const courses = await prisma.course.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ courses: courses.map(serializeCourse) });
  })
);

router.post(
  "/courses",
  validateBody(courseSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof courseSchema>;
    const course = await prisma.course.create({
      data: {
        title: input.title,
        academy: input.academy ? sharedToEnum<Academy>(input.academy) : null,
        subject: input.subject ? sharedToEnum<Subject>(input.subject) : null,
        description: input.description ?? null,
        published: input.published ?? false,
      },
    });
    res.status(201).json({ course: serializeCourse(course) });
  })
);

router.patch(
  "/courses/:id",
  validateBody(courseSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) throw HttpError.notFound("Course not found");
    const input = req.body as Partial<z.infer<typeof courseSchema>>;
    const updated = await prisma.course.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.academy !== undefined ? { academy: input.academy ? sharedToEnum<Academy>(input.academy) : null } : {}),
        ...(input.subject !== undefined ? { subject: input.subject ? sharedToEnum<Subject>(input.subject) : null } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.published !== undefined ? { published: input.published } : {}),
      },
    });
    res.json({ course: serializeCourse(updated) });
  })
);

router.delete(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!existing) throw HttpError.notFound("Course not found");
    await prisma.course.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Books ----------

const bookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  subject: z.enum(SUBJECT_VALUES).nullable().optional(),
  coverUrl: z.string().trim().url().nullable().optional(),
  published: z.boolean().optional(),
});

function serializeBook(b: {
  id: string;
  title: string;
  author: string;
  subject: string | null;
  coverUrl: string | null;
  published: boolean;
}) {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    subject: b.subject ? enumToShared(b.subject) : null,
    coverUrl: b.coverUrl,
    published: b.published,
  };
}

router.get(
  "/books",
  asyncHandler(async (_req, res) => {
    const books = await prisma.book.findMany();
    res.json({ books: books.map(serializeBook) });
  })
);

router.post(
  "/books",
  validateBody(bookSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof bookSchema>;
    const book = await prisma.book.create({
      data: {
        title: input.title,
        author: input.author,
        subject: input.subject ? sharedToEnum<Subject>(input.subject) : null,
        coverUrl: input.coverUrl ?? null,
        published: input.published ?? true,
      },
    });
    res.status(201).json({ book: serializeBook(book) });
  })
);

router.patch(
  "/books/:id",
  validateBody(bookSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!existing) throw HttpError.notFound("Book not found");
    const input = req.body as Partial<z.infer<typeof bookSchema>>;
    const updated = await prisma.book.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.author !== undefined ? { author: input.author } : {}),
        ...(input.subject !== undefined ? { subject: input.subject ? sharedToEnum<Subject>(input.subject) : null } : {}),
        ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl } : {}),
        ...(input.published !== undefined ? { published: input.published } : {}),
      },
    });
    res.json({ book: serializeBook(updated) });
  })
);

router.delete(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!existing) throw HttpError.notFound("Book not found");
    await prisma.book.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Notification broadcast ----------

router.post(
  "/notifications/broadcast",
  validateBody(
    z.object({
      title: z.string().trim().min(1).max(200),
      body: z.string().trim().min(1).max(1000),
      category: z.string().trim().min(1).max(50).optional(),
      userIds: z.array(z.string().min(1)).optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const input = req.body as { title: string; body: string; category?: string; userIds?: string[] };

    const targetUserIds = input.userIds && input.userIds.length > 0
      ? input.userIds
      : (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);

    const category = input.category ?? "admin";
    await prisma.notificationRecord.createMany({
      data: targetUserIds.map((userId) => ({
        userId,
        category,
        title: input.title,
        body: input.body,
      })),
    });

    res.status(201).json({ sentTo: targetUserIds.length });
  })
);

// ---------- Analytics ----------

router.get(
  "/analytics",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

    const [totalUsers, activeUsers, newSignups, aiRequestCount, quizzesTaken] = await Promise.all([
      prisma.user.count(),
      prisma.gamification.count({ where: { lastActivityDate: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.aiUsageRecord.count(),
      prisma.quizAttempt.count(),
    ]);

    res.json({
      date: now.toISOString(),
      totalUsers,
      activeUsers,
      newSignups,
      aiRequestCount,
      quizzesTaken,
    });
  })
);

// ---------- AI usage ----------

router.get(
  "/ai-usage",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(200, Math.max(1, Number.parseInt(String(req.query.pageSize ?? "50"), 10) || 50));

    const [total, records] = await Promise.all([
      prisma.aiUsageRecord.count(),
      prisma.aiUsageRecord.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Rollup: total prompt/completion tokens per user per day (YYYY-MM-DD).
    const rollupMap = new Map<string, { userId: string; day: string; promptTokens: number; completionTokens: number; requests: number }>();
    for (const r of records) {
      const day = r.createdAt.toISOString().slice(0, 10);
      const key = `${r.userId}:${day}`;
      const entry = rollupMap.get(key) ?? { userId: r.userId, day, promptTokens: 0, completionTokens: 0, requests: 0 };
      entry.promptTokens += r.promptTokens;
      entry.completionTokens += r.completionTokens;
      entry.requests += 1;
      rollupMap.set(key, entry);
    }

    res.json({
      total,
      page,
      pageSize,
      records: records.map((r) => ({
        id: r.id,
        userId: r.userId,
        endpoint: r.endpoint,
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        createdAt: r.createdAt.toISOString(),
      })),
      rollups: Array.from(rollupMap.values()),
    });
  })
);

export default router;
