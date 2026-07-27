import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/firebaseAdmin";
import { HttpError } from "../lib/httpError";
import { asyncHandler } from "./errorHandler";

/**
 * Resolves the authenticated identity for a request and attaches the local
 * `User` (auto-provisioned on first sight) + `Profile` (nullable pre-onboarding)
 * rows to `req.user` / `req.profile`.
 *
 * Primary path: verify `Authorization: Bearer <Firebase ID token>` via
 * firebase-admin, then upsert a User keyed by firebaseUid.
 *
 * Dev-only bypass: when ALLOW_DEV_AUTH_BYPASS=true AND the request carries an
 * `x-dev-user-email` header, that email is trusted directly (no token
 * verification) and a User is upserted with a synthetic
 * `firebaseUid = "dev:<email>"`. This must never be enabled in production -
 * see README / .env.example.
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const devBypassEnabled = process.env.ALLOW_DEV_AUTH_BYPASS === "true";
  const devEmailHeader = req.header("x-dev-user-email");

  let firebaseUid: string;
  let email: string;
  let emailVerified: boolean;

  if (devBypassEnabled && devEmailHeader) {
    firebaseUid = `dev:${devEmailHeader.toLowerCase()}`;
    email = devEmailHeader.toLowerCase();
    emailVerified = true;
  } else {
    const authHeader = req.header("authorization") ?? req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw HttpError.unauthorized("Missing Authorization: Bearer <token> header");
    }
    const idToken = authHeader.slice("Bearer ".length).trim();
    if (!idToken) {
      throw HttpError.unauthorized("Missing bearer token");
    }

    try {
      const decoded = await verifyIdToken(idToken);
      firebaseUid = decoded.uid;
      email = (decoded.email ?? "").toLowerCase();
      emailVerified = decoded.email_verified ?? false;
      if (!email) {
        throw HttpError.unauthorized("Firebase token has no associated email");
      }
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw HttpError.unauthorized(`Invalid or expired auth token: ${(err as Error).message}`);
    }
  }

  const user = await prisma.user.upsert({
    where: { firebaseUid },
    update: { email, emailVerified },
    create: { firebaseUid, email, emailVerified },
  });

  if (user.suspended) {
    throw HttpError.forbidden("This account has been suspended");
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  req.user = user;
  req.profile = profile;
  next();
});

/** Must run after requireAuth. Rejects with 403 unless the caller's role is ADMIN. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw HttpError.unauthorized("Authentication required");
  }
  if (req.user.role !== "ADMIN") {
    throw HttpError.forbidden("Admin privileges required");
  }
  next();
}
