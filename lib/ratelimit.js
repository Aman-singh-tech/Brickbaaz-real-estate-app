import "server-only";

// Simple in-memory limiter (per server process). Fine for a single instance; use Redis/Upstash if you scale out.
const hits = new Map();

export function tooMany(key, max = 8, windowMs = 15 * 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return arr.length > max;
}
