/**
 * Structured JSON logger. One line per event (Vercel/Inngest capture stdout),
 * with a stable `correlationId` threaded through the whole pipeline so a single
 * webhook can be traced end to end (grep the id).
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const configured = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";
  return ORDER[configured] ?? ORDER.info;
}

export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  /** Derive a child logger with additional persistent fields. */
  child(fields: LogFields): Logger;
  /** Time an async operation; logs duration on success, duration + error on throw. */
  time<T>(label: string, fn: () => Promise<T>): Promise<T>;
}

function serializeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return { error: error.message, errorName: error.name };
  }
  return { error: String(error) };
}

export function createLogger(base: LogFields = {}): Logger {
  function emit(level: LogLevel, msg: string, fields?: LogFields): void {
    if (ORDER[level] < threshold()) return;
    const line = JSON.stringify({
      level,
      msg,
      ts: new Date().toISOString(),
      ...base,
      ...fields,
    });
    if (level === "error" || level === "warn") console.error(line);
    else console.log(line);
  }

  return {
    debug: (msg, fields) => emit("debug", msg, fields),
    info: (msg, fields) => emit("info", msg, fields),
    warn: (msg, fields) => emit("warn", msg, fields),
    error: (msg, fields) => emit("error", msg, fields),
    child: (fields) => createLogger({ ...base, ...fields }),
    async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
      const start = Date.now();
      try {
        const result = await fn();
        emit("info", `${label} ok`, { durationMs: Date.now() - start });
        return result;
      } catch (error) {
        emit("error", `${label} failed`, { durationMs: Date.now() - start, ...serializeError(error) });
        throw error;
      }
    },
  };
}

/** URL-safe-ish correlation id (no external dep; unique enough for tracing). */
export function newCorrelationId(prefix = "cid"): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
