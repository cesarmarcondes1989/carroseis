export function pct(now: number, prev: number) {
  if (!prev) return now ? 100 : 0;
  return ((now - prev) / prev) * 100;
}
