"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession, destroySession, requireOwnedWedding, requirePlanner } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { parseGuestCsv, validateGuest, type GuestInput } from "@/lib/guests";

export type FormState = { error?: string; message?: string; errors?: string[] };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name || !email) return { error: "Name and email are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  if (await prisma.planner.findUnique({ where: { email } }))
    return { error: "An account with this email already exists." };

  const planner = await prisma.planner.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });
  await createSession(planner.id);
  redirect("/dashboard");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const planner = await prisma.planner.findUnique({ where: { email } });
  // Same message for unknown email and wrong password, so emails can't be enumerated.
  if (!planner || !(await verifyPassword(password, planner.passwordHash)))
    return { error: "Wrong email or password." };
  await createSession(planner.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function createWedding(_: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  const name = text(fd, "name");
  const city = text(fd, "city") || null;
  const deadline = text(fd, "rsvpDeadline");
  if (!name) return { error: "Wedding name is required." };
  if (name.length > 120) return { error: "Wedding name is too long." };

  const wedding = await prisma.wedding.create({
    data: {
      plannerId: planner.id,
      name,
      city,
      // Deadline is a date in IST; store end of that day.
      rsvpDeadline: deadline ? new Date(`${deadline}T23:59:59+05:30`) : null,
    },
  });
  redirect(`/weddings/${wedding.id}`);
}

async function saveGuests(weddingId: string, guests: GuestInput[]) {
  const existing = await prisma.guest.findMany({
    where: { weddingId, phone: { in: guests.map((g) => g.phone) } },
    select: { phone: true },
  });
  const taken = new Set(existing.map((g) => g.phone));
  const fresh = guests.filter((g) => !taken.has(g.phone));
  if (fresh.length) await prisma.guest.createMany({ data: fresh.map((g) => ({ ...g, weddingId })) });
  return { added: fresh.length, skipped: [...taken] };
}

export async function addGuest(weddingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  await requireOwnedWedding(planner.id, weddingId);
  const result = validateGuest({
    name: text(fd, "name"),
    phone: text(fd, "phone"),
    side: text(fd, "side"),
    relation: text(fd, "relation"),
  });
  if (typeof result === "string") return { error: result };

  const { added } = await saveGuests(weddingId, [result]);
  revalidatePath(`/weddings/${weddingId}`);
  return added ? { message: `Added ${result.name}.` } : { error: `${result.phone} is already on the guest list.` };
}

const MAX_CSV_BYTES = 1024 * 1024;

export async function importGuests(weddingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  await requireOwnedWedding(planner.id, weddingId);
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." };
  if (file.size > MAX_CSV_BYTES) return { error: "File is larger than 1 MB." };

  const { guests, errors } = parseGuestCsv(await file.text());
  // All-or-nothing: a planner fixes the file and re-uploads, instead of guessing which rows landed.
  if (errors.length) return { error: `Nothing imported. Fix ${errors.length} row(s):`, errors: errors.slice(0, 20) };

  const { added, skipped } = await saveGuests(weddingId, guests);
  revalidatePath(`/weddings/${weddingId}`);
  return {
    message: `Imported ${added} guest(s).` + (skipped.length ? ` Skipped ${skipped.length} already on the list.` : ""),
  };
}
