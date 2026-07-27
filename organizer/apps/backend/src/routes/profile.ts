import { Router } from "express";
import { z } from "zod";
import { currencyForCountry } from "@organizer/shared";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
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

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ profile: req.profile ? serializeProfile(req.profile) : null });
  })
);

const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    age: z.number().int().min(5).max(120).nullable(),
    country: z.string().trim().min(1).max(120),
    countryCode: z.string().trim().min(2).max(3),
    language: z.string().trim().min(2).max(10),
    mode: z.enum(["student", "business", "personal"]),
    businessRole: z.enum(["owner", "employee"]).nullable(),
    ownsBusiness: z.boolean().nullable(),
    personalFocus: z.array(z.enum(PERSONAL_FOCUS_VALUES)),
    avatarUrl: z.string().trim().url().nullable(),
    tutorialCompleted: z.boolean(),
  })
  .partial();

/** PATCH /api/profile - partial update; recomputes currency if countryCode changes. */
router.patch(
  "/",
  requireAuth,
  validateBody(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const input = req.body as z.infer<typeof profileUpdateSchema>;

    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (!existing) {
      throw HttpError.badRequest("Complete onboarding before updating your profile");
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.age !== undefined) data.age = input.age;
    if (input.country !== undefined) data.country = input.country;
    if (input.countryCode !== undefined) {
      data.countryCode = input.countryCode.toUpperCase();
      data.currency = currencyForCountry(input.countryCode);
    }
    if (input.language !== undefined) data.language = input.language;
    if (input.mode !== undefined) data.mode = sharedToEnum(input.mode);
    if (input.businessRole !== undefined) {
      data.businessRole = input.businessRole ? sharedToEnum(input.businessRole) : null;
    }
    if (input.ownsBusiness !== undefined) data.ownsBusiness = input.ownsBusiness;
    if (input.personalFocus !== undefined) {
      data.personalFocus = enumArrayToPrisma(input.personalFocus);
    }
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
    if (input.tutorialCompleted !== undefined) data.tutorialCompleted = input.tutorialCompleted;

    const profile = await prisma.profile.update({ where: { userId }, data });
    res.json({ profile: serializeProfile(profile) });
  })
);

export default router;
