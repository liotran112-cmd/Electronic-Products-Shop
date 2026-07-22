/** HTTP resilience helpers: timeouts, retries with exponential backoff + jitter. */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly retryAfterMs: number | null,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} for ${url}`);
    this.name = "HttpError";
  }
}

/** fetch() with a hard timeout (AbortSignal.timeout). Never hangs a worker. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

/** True for transient failures worth retrying (network/timeout/429/5xx). */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || (status >= 500 && status <= 599);
}

export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  isRetryable?: (error: unknown) => boolean;
  /** Explicit delay override (e.g. honor Retry-After). Return ms or null. */
  retryDelay?: (error: unknown, attempt: number) => number | null;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/** Retry an async op with exponential backoff + jitter. */
export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    retries = 3,
    baseMs = 200,
    maxMs = 5_000,
    isRetryable = () => true,
    retryDelay,
    onRetry,
  } = opts;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries || !isRetryable(error)) throw error;
      const override = retryDelay?.(error, attempt) ?? null;
      const backoff = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
      const jitter = backoff * 0.25 * Math.random();
      const delayMs = override ?? Math.round(backoff + jitter);
      onRetry?.(attempt, error, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/** Default retry predicate for HttpError / network AbortError. */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpError) return isRetryableStatus(error.status);
  if (error instanceof Error) {
    return error.name === "AbortError" || error.name === "TimeoutError" || error.name === "TypeError";
  }
  return false;
}
