import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
import { enumToShared, sharedToEnum } from "../utils/serialize";
import type { CalendarCategory, NotificationCategory } from "@prisma/client";

const router = Router();

const CALENDAR_CATEGORY_VALUES = [
  "homework",
  "exam",
  "business",
  "personal",
  "habit",
  "goal",
  "reading",
  "study",
] as const;

const NOTIFICATION_CATEGORY_VALUES = ["goal", "homework", "exam", "habit", "reading", "study"] as const;

function serializeEvent(e: {
  id: string;
  userId: string;
  title: string;
  category: string;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    id: e.id,
    userId: e.userId,
    title: e.title,
    category: enumToShared(e.category),
    startAt: e.startAt.toISOString(),
    endAt: e.endAt ? e.endAt.toISOString() : null,
    allDay: e.allDay,
    notes: e.notes,
    createdAt: e.createdAt.toISOString(),
  };
}

const eventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(CALENDAR_CATEGORY_VALUES),
  startAt: z.string().min(1),
  endAt: z.string().min(1).nullable().optional(),
  allDay: z.boolean().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

const dateRangeQuerySchema = z.object({
  from: z.string().min(1).refine((v) => !Number.isNaN(Date.parse(v)), "must be a valid date").optional(),
  to: z.string().min(1).refine((v) => !Number.isNaN(Date.parse(v)), "must be a valid date").optional(),
});

/** GET /?from=&to= - filters events whose startAt falls in the given range (defaults to all). */
router.get(
  "/",
  requireAuth,
  validateQuery(dateRangeQuerySchema),
  asyncHandler(async (req, res) => {
    const { from, to } = req.validatedQuery as z.infer<typeof dateRangeQuerySchema>;

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: req.user!.id,
        ...(from || to
          ? {
              startAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { startAt: "asc" },
    });
    res.json({ events: events.map(serializeEvent) });
  })
);

router.post(
  "/",
  requireAuth,
  validateBody(eventSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof eventSchema>;
    const event = await prisma.calendarEvent.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        category: sharedToEnum<CalendarCategory>(input.category),
        startAt: new Date(input.startAt),
        endAt: input.endAt ? new Date(input.endAt) : null,
        allDay: input.allDay ?? false,
        notes: input.notes ?? null,
      },
    });
    res.status(201).json({ event: serializeEvent(event) });
  })
);

router.patch(
  "/:id",
  requireAuth,
  validateBody(eventSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Event not found");
    const input = req.body as Partial<z.infer<typeof eventSchema>>;
    const updated = await prisma.calendarEvent.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.category !== undefined ? { category: sharedToEnum<CalendarCategory>(input.category) } : {}),
        ...(input.startAt !== undefined ? { startAt: new Date(input.startAt) } : {}),
        ...(input.endAt !== undefined ? { endAt: input.endAt ? new Date(input.endAt) : null } : {}),
        ...(input.allDay !== undefined ? { allDay: input.allDay } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    res.json({ event: serializeEvent(updated) });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Event not found");
    await prisma.calendarEvent.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

// ---------- Reminder rules ----------

const reminderSchema = z.object({
  category: z.enum(NOTIFICATION_CATEGORY_VALUES),
  relatedId: z.string().trim().max(100).nullable().optional(),
  remindAt: z.string().min(1),
  message: z.string().trim().min(1).max(500),
});

function serializeReminder(r: {
  id: string;
  userId: string;
  category: string;
  relatedId: string | null;
  remindAt: Date;
  message: string;
  sent: boolean;
}) {
  return {
    id: r.id,
    userId: r.userId,
    category: enumToShared(r.category),
    relatedId: r.relatedId,
    remindAt: r.remindAt.toISOString(),
    message: r.message,
    sent: r.sent,
  };
}

router.get(
  "/reminders",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reminders = await prisma.reminderRule.findMany({
      where: { userId: req.user!.id },
      orderBy: { remindAt: "asc" },
    });
    res.json({ reminders: reminders.map(serializeReminder) });
  })
);

router.post(
  "/reminders",
  requireAuth,
  validateBody(reminderSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof reminderSchema>;
    const reminder = await prisma.reminderRule.create({
      data: {
        userId: req.user!.id,
        category: sharedToEnum<NotificationCategory>(input.category),
        relatedId: input.relatedId ?? null,
        remindAt: new Date(input.remindAt),
        message: input.message,
      },
    });
    res.status(201).json({ reminder: serializeReminder(reminder) });
  })
);

router.patch(
  "/reminders/:id",
  requireAuth,
  validateBody(reminderSchema.partial().extend({ sent: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.reminderRule.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Reminder not found");
    const input = req.body as Partial<z.infer<typeof reminderSchema>> & { sent?: boolean };
    const updated = await prisma.reminderRule.update({
      where: { id: existing.id },
      data: {
        ...(input.category !== undefined ? { category: sharedToEnum<NotificationCategory>(input.category) } : {}),
        ...(input.relatedId !== undefined ? { relatedId: input.relatedId } : {}),
        ...(input.remindAt !== undefined ? { remindAt: new Date(input.remindAt) } : {}),
        ...(input.message !== undefined ? { message: input.message } : {}),
        ...(input.sent !== undefined ? { sent: input.sent } : {}),
      },
    });
    res.json({ reminder: serializeReminder(updated) });
  })
);

router.delete(
  "/reminders/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.reminderRule.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Reminder not found");
    await prisma.reminderRule.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
