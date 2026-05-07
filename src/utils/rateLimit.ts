const lastRequest = new Map<number, number>();
const WINDOW_MS = 5000;

export function checkRateLimit(userId: number): number | null {
  const now = Date.now();
  const last = lastRequest.get(userId);
  if (last !== undefined && now - last < WINDOW_MS) {
    return Math.ceil((WINDOW_MS - (now - last)) / 1000);
  }
  lastRequest.set(userId, now);
  return null;
}
