import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient.
 *
 * In development, `tsx watch` re-executes modules on every file change. Without
 * this guard, each reload would create a brand-new PrismaClient (and a new pool
 * of DB connections) that never gets closed, quickly exhausting Postgres'
 * `max_connections`. We stash the client on `globalThis` so hot reloads reuse it.
 */

declare global {
  // eslint-disable-next-line no-var
  var __organizerPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__organizerPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__organizerPrisma = prisma;
}

export default prisma;
