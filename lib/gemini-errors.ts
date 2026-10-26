// 429s, 503s and timeouts become the friendly "busy" state.
export function isBusyError(err: unknown): boolean {
  if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) return true;
  const status = (err as { status?: number }).status;
  if (status === 429 || status === 503) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b|RESOURCE_EXHAUSTED|\b503\b|UNAVAILABLE|DEADLINE|timed? ?out|abort/i.test(msg);
}

export function errorStatus(err: unknown): number | string {
  return (err as { status?: number }).status ?? (err instanceof Error ? err.name : "unknown");
}
