import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";
import { serializeGamification, serializeProfile, serializeUser } from "../utils/serializeUser";

const router = Router();

/**
 * GET /api/auth/me
 * Returns the caller's local User + Profile (may be null pre-onboarding) +
 * Gamification snapshot. The User row is auto-provisioned by requireAuth on
 * first sight of a valid Firebase ID token (or dev bypass header).
 */
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const gamification = await prisma.gamification.findUnique({ where: { userId: req.user!.id } });
    res.json({
      user: serializeUser(req.user!),
      profile: req.profile ? serializeProfile(req.profile) : null,
      gamification: gamification ? serializeGamification(gamification) : null,
    });
  })
);

export default router;
