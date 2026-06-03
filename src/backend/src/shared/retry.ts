const TRANSIENT_CONNECTION_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "PROTOCOL_CONNECTION_LOST",
  "ER_CON_COUNT_ERROR",
  "ER_SERVER_SHUTDOWN",
  "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
]);

export function isTransientConnectionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  return TRANSIENT_CONNECTION_CODES.has(code);
}

export async function waitForRetry(attempt: number) {
  const delayMs = Math.min(100 * 2 ** attempt, 800);
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
