import type { Profile, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth once the caller's Firebase ID token (or dev bypass) resolves to a local User row. */
      user?: User;
      /** Populated by requireAuth; may be null when the user hasn't completed onboarding yet. */
      profile?: Profile | null;
      /** Populated by validateQuery() when a route uses it; holds the parsed/validated query object. */
      validatedQuery?: unknown;
    }
  }
}

export {};
