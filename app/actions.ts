"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession, destroySession, requireOwnedWedding, requirePlanner } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { newGuestToken, parseGuestCsv, validateGuest, type GuestInput } from "@/lib/guests";
import { isRsvpOpen, parseRsvpForm } from "@/lib/rsvp";

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
  // Deadline is a date in IST; store end of that day. Checked because a raw POST can send anything.
  const rsvpDeadline = deadline ? new Date(`${deadline}T23:59:59+05:30`) : null;
  if (deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || isNaN(rsvpDeadline!.getTime())))
    return { error: "Enter a valid RSVP deadline." };

  const wedding = await prisma.wedding.create({
    data: {
      plannerId: planner.id,
      name,
      city,
      rsvpDeadline,
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
  if (fresh.length)
    await prisma.guest.createMany({ data: fresh.map((g) => ({ ...g, weddingId, token: newGuestToken() })) });
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

// Public: the guest's invite token is the only credential.
export async function saveRsvp(token: string, _: FormState, fd: FormData): Promise<FormState> {
  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { wedding: { include: { events: true } } },
  });
  if (!guest) return { error: "This invite link is not valid. Ask the family for a new one." };
  if (!isRsvpOpen(guest.wedding.rsvpDeadline)) return { error: "RSVPs for this wedding are closed." };

  const { rsvps, errors } = parseRsvpForm(guest.wedding.events, (key) => String(fd.get(key) ?? ""));
  if (errors.length) return { error: "Please fix these:", errors };

  // One transaction so a guest never ends up with half their events saved.
  await prisma.$transaction(
    rsvps.map(({ eventId, ...answer }) =>
      prisma.rsvp.upsert({
        where: { guestId_eventId: { guestId: guest.id, eventId } },
        create: { guestId: guest.id, eventId, ...answer },
        update: answer,
      }),
    ),
  );
  revalidatePath(`/r/${token}`);
  revalidatePath(`/weddings/${guest.weddingId}`);
  return { message: "Saved. Thank you!" };
}

export async function addEvent(weddingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  await requireOwnedWedding(planner.id, weddingId);
  const name = text(fd, "name");
  const date = text(fd, "date");
  const time = text(fd, "time");
  const venue = text(fd, "venue") || null;
  if (!name) return { error: "Function name is required." };
  if (name.length > 60) return { error: "Function name is too long." };
  // Date and time are entered in IST.
  const startsAt = new Date(`${date}T${time}:00+05:30`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || isNaN(startsAt.getTime()))
    return { error: "Enter a valid date and time." };

  await prisma.event.create({ data: { weddingId, name, startsAt, venue } });
  revalidatePath(`/weddings/${weddingId}`);
  return { message: `Added ${name}.` };
}

// Called when the planner clicks a WhatsApp invite / reminder button. Best effort: a click, not proof of delivery.
export async function markSent(guestId: string, kind: "invite" | "reminder") {
  if (kind !== "invite" && kind !== "reminder") return; // bound args come from the client, so check them
  const planner = await requirePlanner();
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, wedding: { plannerId: planner.id } },
    select: { weddingId: true },
  });
  if (!guest) return;
  const now = new Date();
  await prisma.guest.update({
    where: { id: guestId },
    data: kind === "invite" ? { invitedAt: now } : { remindedAt: now, reminderCount: { increment: 1 } },
  });
  revalidatePath(`/weddings/${guest.weddingId}`);
}

export async function recordActual(eventId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  const event = await prisma.event.findFirst({
    where: { id: eventId, wedding: { plannerId: planner.id } },
    select: { weddingId: true, startsAt: true },
  });
  if (!event) return { error: "Function not found." };
  if (event.startsAt > new Date()) return { error: "You can record turnout once the function has started." };
  const raw = text(fd, "actual");
  if (!/^\d{1,5}$/.test(raw)) return { error: "Enter the number of people who came." };

  await prisma.event.update({ where: { id: eventId }, data: { actualCount: Number(raw) } });
  revalidatePath(`/weddings/${event.weddingId}`);
  return { message: "Saved." };
}
