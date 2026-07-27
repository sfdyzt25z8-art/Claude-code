import type { Gamification, Profile, User } from "@prisma/client";
import { enumArrayToShared, enumToShared } from "./serialize";

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    role: enumToShared<"user" | "admin">(user.role),
  };
}

export function serializeProfile(profile: Profile) {
  return {
    userId: profile.userId,
    name: profile.name,
    age: profile.age,
    country: profile.country,
    countryCode: profile.countryCode,
    language: profile.language,
    currency: profile.currency,
    mode: profile.mode ? enumToShared(profile.mode) : null,
    businessRole: profile.businessRole ? enumToShared(profile.businessRole) : null,
    personalFocus: enumArrayToShared(profile.personalFocus),
    ownsBusiness: profile.ownsBusiness,
    avatarUrl: profile.avatarUrl,
    onboardingCompleted: profile.onboardingCompleted,
    tutorialCompleted: profile.tutorialCompleted,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function serializeGamification(gamification: Gamification) {
  return {
    userId: gamification.userId,
    xp: gamification.xp,
    level: gamification.level,
    coins: gamification.coins,
    currentStreak: gamification.currentStreak,
    longestStreak: gamification.longestStreak,
    lastActivityDate: gamification.lastActivityDate
      ? gamification.lastActivityDate.toISOString()
      : null,
  };
}
