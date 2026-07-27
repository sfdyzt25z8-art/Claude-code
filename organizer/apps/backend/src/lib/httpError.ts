/**
 * Known, intentional HTTP errors (400/401/403/404/409/etc). The central error
 * handler renders these with their given status + message. Anything that
 * isn't an HttpError is treated as unexpected (logged, 500 returned, and the
 * underlying message/stack is hidden from the client in production).
 */
export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }

  static badRequest(message = "Bad request", details?: unknown): HttpError {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = "Unauthorized"): HttpError {
    return new HttpError(401, message);
  }

  static forbidden(message = "Forbidden"): HttpError {
    return new HttpError(403, message);
  }

  static notFound(message = "Not found"): HttpError {
    return new HttpError(404, message);
  }

  static conflict(message = "Conflict"): HttpError {
    return new HttpError(409, message);
  }
}
