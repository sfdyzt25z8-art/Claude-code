import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

function formatZodErrors(error: { errors: { path: (string | number)[]; message: string }[] }) {
  return error.errors.map((e) => ({ field: e.path.join(".") || "(root)", message: e.message }));
}

/**
 * Validates req.body against a zod schema. On success, replaces req.body with
 * the parsed (and possibly coerced/defaulted) value. On failure, responds 400
 * with per-field error messages instead of calling next().
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: { message: "Invalid request body", fields: formatZodErrors(result.error) } });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against a zod schema. On success, stores the parsed
 * value on `req.validatedQuery` (req.query itself is read-only in newer
 * Express/Node versions, so we don't attempt to overwrite it).
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: { message: "Invalid query parameters", fields: formatZodErrors(result.error) } });
      return;
    }
    req.validatedQuery = result.data;
    next();
  };
}
