import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { HttpError } from "../lib/httpError";

/** Wrap async route handlers so rejected promises reach the error handler. */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Req, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.path}` } });
}

// Express recognizes error-handling middleware by arity (4 params) - do not remove unused args.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  const isProd = process.env.NODE_ENV === "production";

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({ error: { message: `Upload error: ${err.message}` } });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[unhandled error]", err);

  const message = err instanceof Error ? err.message : "Unexpected error";
  res.status(500).json({
    error: {
      message: isProd ? "Internal server error" : message,
      ...(isProd ? {} : { stack: err instanceof Error ? err.stack : undefined }),
    },
  });
}
