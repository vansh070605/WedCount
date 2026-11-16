import { createHash } from "node:crypto";

// Fixed-window limit: at most `limit` actions per `windowMs` for one key.
export const SIGNUPS_PER_HOUR = 5;
export const HOUR = 60 * 60 * 1000;

export type Window = { count: number; windowStart: Date };

// Pure decision: is one more action allowed, and what should the stored window become?
export function nextWindow(row: Window | null, now: Date, limit: number, windowMs: number) {
  if (!row || now.getTime() - row.windowStart.getTime() >= windowMs)
    return { allowed: true, reset: true, count: 1, windowStart: now };
  if (row.count >= limit) return { allowed: false, reset: false, count: row.count, windowStart: row.windowStart };
  return { allowed: true, reset: false, count: row.count + 1, windowStart: row.windowStart };
}

export const limitKey = (action: string, ip: string) => createHash("sha256").update(`${action}:${ip}`).digest("hex");

// First address in x-forwarded-for is the client on Vercel; locally there is none.
export const clientIp = (h: Headers) => h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
