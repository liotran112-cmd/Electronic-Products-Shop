/** Typed BFF errors. Pages map these to notFound()/error boundaries (§9). */

export class BffError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Resource does not exist → 404. */
export class NotFoundError extends BffError {
  constructor(
    readonly resource: string,
    readonly ref: string,
  ) {
    super(`${resource} not found: ${ref}`);
  }
}

/** Resource existed but was removed (archived) → 404/410. */
export class GoneError extends BffError {
  constructor(readonly ref: string) {
    super(`Resource gone: ${ref}`);
  }
}

/** Resource is a draft → 404 for the public (visible only in preview). */
export class DraftError extends BffError {
  constructor(readonly ref: string) {
    super(`Resource not published: ${ref}`);
  }
}

/** A required upstream source failed (timeout/5xx) → error boundary. */
export class UpstreamError extends BffError {
  constructor(
    readonly source: string,
    cause?: unknown,
  ) {
    super(`Upstream failure: ${source}`, cause);
  }
}

/** Request is unauthenticated where a user is required. */
export class UnauthenticatedError extends BffError {
  constructor() {
    super("Authentication required");
  }
}

/** Type guard for mapping errors to HTTP semantics in pages/handlers. */
export function isNotFoundLike(error: unknown): boolean {
  return error instanceof NotFoundError || error instanceof GoneError || error instanceof DraftError;
}
