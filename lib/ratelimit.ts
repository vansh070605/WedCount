import { createHash } from "node:crypto";
import { prisma } from "./db";

// Fixed-window limit: at most `limit` actions per `windowMs` for one key.
export const SIGNUPS_PER_HOUR = 5;
export const HOUR = 60 * 60 * 1000;

// One atomic statement counts the action and reports the new count, so parallel requests can't both read
// the same old count and slip past the limit. An expired window restarts at 1.
export async function hit(key: string, limit: number, windowMs: number, now = new Date()) {
  const since = new Date(now.getTime() - windowMs);
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart") VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" <= ${since} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" <= ${since} THEN ${now} ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  return row.count <= limit;
}

export const limitKey = (action: string, ip: string) => createHash("sha256").update(`${action}:${ip}`).digest("hex");

// First address in x-forwarded-for is the client on Vercel; locally there is none.
export const clientIp = (h: Headers) => h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
