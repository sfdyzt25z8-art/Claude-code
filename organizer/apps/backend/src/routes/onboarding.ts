import { Router } from "express";
import { z } from "zod";
import type { AppMode as PrismaAppMode, PersonalFocus as PrismaPersonalFocus } from "@prisma/client";
import { currencyForCountry } from "@organizer/shared";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";
import { ensureGamification } from "../services/gamification";
import { serializeProfile } from "../utils/serializeUser";
import { enumArrayToPrisma, sharedToEnum } from "../utils/serialize";

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

const onboardingSchema = z.object({
  name: z.string().trim().min(1).max(120),
  age: z.number().int().min(5).max(120),
  country: z.string().trim().min(1).max(120),
  countryCode: z.string().trim().min(2).max(3),
  language: z.string().trim().min(2).max(10),
  mode: z.enum(["student", "business", "personal"]),
  ownsBusiness: z.boolean().optional(),
  personalFocus: z.array(z.enum(PERSONAL_FOCUS_VALUES)).optional(),
});

/**
 * POST /api/onboarding
 * Creates or updates the caller's Profile from the OnboardingInput-shaped
 * body, deriving currency from countryCode, and ensures a Gamification row
 * exists. Marks onboardingCompleted=true.
 */
router.post(
  "/",
  requireAuth,
  validateBody(onboardingSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof onboardingSchema>;
    const userId = req.user!.id;
    const currency = currencyForCountry(input.countryCode);

    const data = {
      name: input.name,
      age: input.age,
      country: input.country,
      countryCode: input.countryCode.toUpperCase(),
      language: input.language,
      currency,
      mode: sharedToEnum<PrismaAppMode>(input.mode),
      ownsBusiness: input.ownsBusiness ?? null,
      personalFocus: input.personalFocus
        ? enumArrayToPrisma<PrismaPersonalFocus>(input.personalFocus)
        : ([] as PrismaPersonalFocus[]),
      onboardingCompleted: true,
    };

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    await ensureGamification(userId);

    res.status(200).json({ profile: serializeProfile(profile) });
  })
);

export default router;
