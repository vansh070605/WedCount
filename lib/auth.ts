import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { findOwnedWedding } from "@/lib/owned";

const COOKIE = "wc_session";
const SESSION_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(plannerId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  // Housekeeping: drop this planner's expired sessions so the table doesn't grow forever.
  await prisma.session.deleteMany({ where: { plannerId, expiresAt: { lt: new Date() } } });
  await prisma.session.create({ data: { id: sha256(token), plannerId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  store.delete(COOKIE);
}

export async function getPlanner() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: { planner: { select: { id: true, name: true, email: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.planner;
}

export async function requirePlanner() {
  const planner = await getPlanner();
  if (!planner) redirect("/login");
  return planner;
}

// Returns the wedding only if it belongs to this planner; 404 otherwise, so ids can't be probed.
export async function requireOwnedWedding(plannerId: string, weddingId: string) {
  const wedding = await findOwnedWedding(plannerId, weddingId);
  if (!wedding) notFound();
  return wedding;
}
