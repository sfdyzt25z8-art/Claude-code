import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
import { enumToShared, sharedToEnum } from "../utils/serialize";
import type { Platform } from "@prisma/client";

const router = Router();

const PLATFORM_VALUES = ["ios", "android", "web"] as const;

/** POST /push-token - registers/updates a device push token for the caller (upsert by unique token). */
router.post(
  "/push-token",
  requireAuth,
  validateBody(z.object({ token: z.string().trim().min(1), platform: z.enum(PLATFORM_VALUES) })),
  asyncHandler(async (req, res) => {
    const { token, platform } = req.body as { token: string; platform: (typeof PLATFORM_VALUES)[number] };
    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      create: { userId: req.user!.id, token, platform: sharedToEnum<Platform>(platform) },
      update: { userId: req.user!.id, platform: sharedToEnum<Platform>(platform) },
    });
    res.status(201).json({
      pushToken: {
        id: pushToken.id,
        userId: pushToken.userId,
        token: pushToken.token,
        platform: enumToShared(pushToken.platform),
        createdAt: pushToken.createdAt.toISOString(),
      },
    });
  })
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unread === "true";
    const notifications = await prisma.notificationRecord.findMany({
      where: { userId: req.user!.id, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        category: n.category,
        title: n.title,
        body: n.body,
        data: n.data,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  })
);

router.patch(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.notificationRecord.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) throw HttpError.notFound("Notification not found");
    const updated = await prisma.notificationRecord.update({
      where: { id: existing.id },
      data: { read: true },
    });
    res.json({
      notification: {
        id: updated.id,
        userId: updated.userId,
        category: updated.category,
        title: updated.title,
        body: updated.body,
        data: updated.data,
        read: updated.read,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  })
);

export default router;
