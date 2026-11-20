"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession, destroySession, requireOwnedWedding, requirePlanner } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { nameKey, newGuestToken, parseGuestCsv, validateGuest, type GuestInput } from "@/lib/guests";
import { deadlineProblem, invitedEvents, isEventOpen, parseRsvpForm, pastProblem } from "@/lib/rsvp";
import { LOGIN_FAILED, afterFailure, isLocked } from "@/lib/lockout";
import { findOwnedEvent, findOwnedGuest } from "@/lib/owned";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { HOUR, SIGNUPS_PER_HOUR, clientIp, hit, limitKey } from "@/lib/ratelimit";
import { RESET_SENT, hashToken, isUsable, newResetToken, resetEmail, resetExpiry } from "@/lib/reset";
import { sendEmail } from "@/lib/mail";
import { checkIn, doorOpen } from "@/lib/checkin";
import { appUrl, templateProblem } from "@/lib/invite";
import { MAX_FAMILY, THEMES } from "@/lib/invitation";

// Two requests inserting the same unique value at once: the database rejects the second with P2002.
const isDuplicate = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

// `duplicate` asks the form to offer "different person, same name" before saving again.
export type FormState = { error?: string; message?: string; errors?: string[]; duplicate?: boolean };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name || !email) return { error: "Name and email are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!(await allow("signup", SIGNUPS_PER_HOUR)))
    return { error: "Too many new accounts from this network. Please try again in an hour." };

  if (await prisma.planner.findUnique({ where: { email } }))
    return { error: "An account with this email already exists." };

  let planner;
  try {
    planner = await prisma.planner.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  } catch (e) {
    if (isDuplicate(e)) return { error: "An account with this email already exists." };
    throw e;
  }
  await createSession(planner.id);
  redirect("/home");
}

// At most `limit` attempts of an action per client IP per hour (signups, reset emails), so one script can't flood them.
async function allow(action: string, limit: number) {
  return hit(limitKey(action, clientIp(await headers())), limit, HOUR);
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const planner = await prisma.planner.findUnique({ where: { email } });
  if (!planner || isLocked(planner.lockedUntil)) return { error: LOGIN_FAILED };

  if (!(await verifyPassword(password, planner.passwordHash))) {
    // Atomic increment, so parallel guesses can't each read the same old count.
    const { failedLogins } = await prisma.planner.update({
      where: { id: planner.id },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    const next = afterFailure(failedLogins);
    if (next.lockedUntil) await prisma.planner.update({ where: { id: planner.id }, data: next });
    return { error: LOGIN_FAILED };
  }

  if (planner.failedLogins > 0) await prisma.planner.update({ where: { id: planner.id }, data: { failedLogins: 0 } });
  await createSession(planner.id);
  redirect("/home");
}

// Emails a one-time reset link. Replies the same way whether or not the email has an account.
export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (!(await allow("reset", 5))) return { error: "Too many reset requests from this network. Please try again in an hour." };

  const planner = await prisma.planner.findUnique({ where: { email }, select: { id: true, name: true } });
  if (planner) {
    const token = newResetToken();
    // A new link replaces any older unused one.
    await prisma.$transaction([
      prisma.passwordReset.deleteMany({ where: { plannerId: planner.id, usedAt: null } }),
      prisma.passwordReset.create({ data: { id: hashToken(token), plannerId: planner.id, expiresAt: resetExpiry() } }),
    ]);
    const sent = await sendEmail({ to: email, ...resetEmail({ name: planner.name, link: `${appUrl()}/reset-password/${token}` }) });
    if (!sent) return { error: "We couldn't send the email just now. Please try again in a few minutes." };
  }
  return { message: RESET_SENT };
}

// Sets a new password from a reset link, signs out every other device, and logs this one in.
export async function resetPassword(token: string, _: FormState, fd: FormData): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== String(fd.get("confirm") ?? "")) return { error: "The two passwords don't match." };

  const id = hashToken(token);
  const reset = await prisma.passwordReset.findUnique({ where: { id } });
  if (!isUsable(reset)) return { error: "This link has expired or was already used. Ask for a new one." };

  const passwordHash = await hashPassword(password);
  // Claim the link first, guarded on usedAt, so two parallel submits can't both change the password.
  const changed = await prisma.$transaction(async (tx) => {
    const claim = await tx.passwordReset.updateMany({ where: { id, usedAt: null }, data: { usedAt: new Date() } });
    if (claim.count === 0) return false;
    await tx.planner.update({ where: { id: reset!.plannerId }, data: { passwordHash, failedLogins: 0, lockedUntil: null } });
    await tx.session.deleteMany({ where: { plannerId: reset!.plannerId } });
    return true;
  });
  if (!changed) return { error: "This link has expired or was already used. Ask for a new one." };
  await createSession(reset!.plannerId);
  redirect("/home");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// Shared by create and edit. Deadline is a date in IST; store end of that day. Checked because a raw POST can send anything.
function parseWeddingForm(fd: FormData) {
  const name = text(fd, "name");
  const city = text(fd, "city") || null;
  const deadline = text(fd, "rsvpDeadline");
  if (!name) return "Wedding name is required.";
  if (name.length > 120) return "Wedding name is too long.";
  if (city && city.length > 80) return "City is too long.";
  const rsvpDeadline = deadline ? new Date(`${deadline}T23:59:59+05:30`) : null;
  if (deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || isNaN(rsvpDeadline!.getTime())))
    return "Enter a valid RSVP deadline.";
  return { name, city, rsvpDeadline };
}

export async function createWedding(_: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  const data = parseWeddingForm(fd);
  if (typeof data === "string") return { error: data };
  const past = pastProblem(data.rsvpDeadline, "deadline");
  if (past) return { error: past };
  const wedding = await prisma.wedding.create({ data: { plannerId: planner.id, ...data } });
  redirect(`/weddings/${wedding.id}`);
}

export async function updateWedding(weddingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  const current = await requireOwnedWedding(planner.id, weddingId);
  const data = parseWeddingForm(fd);
  if (typeof data === "string") return { error: data };
  const past = pastProblem(data.rsvpDeadline, "deadline", new Date(), current.rsvpDeadline);
  if (past) return { error: past };
  const events = await prisma.event.findMany({ where: { weddingId }, select: { name: true, startsAt: true } });
  const late = deadlineProblem(data.rsvpDeadline, events);
  if (late) return { error: late };
  await prisma.wedding.update({ where: { id: weddingId }, data });
  revalidatePath(`/weddings/${weddingId}`, "layout");
  revalidatePath("/dashboard");
  return { message: "Saved." };
}

// How the guest invitation looks and who it's from: theme, the couple's names, parents, blessing line.
export async function saveInvitation(weddingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  await requireOwnedWedding(planner.id, weddingId);
  const theme = text(fd, "theme");
  if (!THEMES.some((t) => t.id === theme)) return { error: "Pick one of the themes." };
  const fields = ["brideName", "groomName", "brideParents", "groomParents", "blessing"] as const;
  const data = Object.fromEntries(fields.map((f) => [f, text(fd, f) || null])) as Record<(typeof fields)[number], string | null>;
  if (fields.some((f) => (data[f]?.length ?? 0) > MAX_FAMILY)) return { error: `Keep each line under ${MAX_FAMILY} characters.` };
  if (!data.brideName !== !data.groomName) return { error: "Add both names, or leave both empty to use the wedding name." };
  await prisma.wedding.update({ where: { id: weddingId }, data: { theme, ...data } });
  revalidatePath(`/weddings/${weddingId}`, "layout");
  return { message: "Saved. Guests see the new invitation right away." };
}

// The planner's own WhatsApp invite text. Empty resets to the default.
export async function saveInviteTemplate(weddingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  await requireOwnedWedding(planner.id, weddingId);
  const raw = String(fd.get("template") ?? "").replace(/\r\n/g, "\n").trim();
  if (raw) {
    const problem = templateProblem(raw);
    if (problem) return { error: problem };
  }
  await prisma.wedding.update({ where: { id: weddingId }, data: { inviteTemplate: raw || null } });
  revalidatePath(`/weddings/${weddingId}`, "layout");
  return { message: raw ? "Saved. New invites use this message." : "Back to the default message." };
}

// Deletes the wedding with every function, guest and reply in it (cascade); invite links stop working. The button asks first.
export async function deleteWedding(weddingId: string) {
  const planner = await requirePlanner();
  await requireOwnedWedding(planner.id, weddingId);
  await prisma.wedding.delete({ where: { id: weddingId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// Deletes the planner and everything they own (cascade). Needs the password, so a borrowed open laptop can't do it.
export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  const row = await prisma.planner.findUnique({ where: { id: planner.id }, select: { passwordHash: true } });
  if (!row || !(await verifyPassword(String(fd.get("password") ?? ""), row.passwordHash)))
    return { error: "That password is not right." };
  await destroySession();
  await prisma.planner.delete({ where: { id: planner.id } });
  redirect("/");
}

async function saveGuests(weddingId: string, guests: GuestInput[]) {
  const existing = await prisma.guest.findMany({
    where: { weddingId, phone: { in: guests.map((g) => g.phone) } },
    select: { phone: true },
  });
  const taken = new Set(existing.map((g) => g.phone));
  const fresh = guests.filter((g) => !taken.has(g.phone));
  try {
    // One statement, so either all fresh guests are saved or none are.
    if (fresh.length)
      await prisma.guest.createMany({ data: fresh.map((g) => ({ ...g, weddingId, token: newGuestToken() })) });
  } catch (e) {
    if (isDuplicate(e)) return null; // someone saved the same phone at the same moment
    throw e;
  }
  return { added: fresh.length, skipped: [...taken] };
}
const SAVE_RACE = "Someone else just added some of these guests. Nothing was saved; refresh and try again.";

// Which functions the form ticked. All of them (or a wedding with none) is stored as no rows, meaning "every function",
// so functions added later include this guest automatically.
async function chosenFunctions(weddingId: string, fd: FormData) {
  const all = await prisma.event.findMany({ where: { weddingId }, select: { id: true } });
  if (all.length === 0) return { ids: [] as string[] };
  const picked = new Set(fd.getAll("events").map(String));
  const ids = all.map((e) => e.id).filter((id) => picked.has(id)); // ignore ids from other weddings
  if (ids.length === 0) return { error: "Tick at least one function this guest is invited to." };
  return { ids: ids.length === all.length ? [] : ids };
}

// Another guest on this wedding with the same name (ignoring case, spaces and dots), unless the planner said it's fine.
async function sameNameGuest(weddingId: string, name: string, fd: FormData, exceptId?: string) {
  if (fd.get("sameNameOk") === "on") return null;
  const others = await prisma.guest.findMany({ where: { weddingId, NOT: exceptId ? { id: exceptId } : undefined }, select: { name: true, phone: true } });
  return others.find((g) => nameKey(g.name) === nameKey(name)) ?? null;
}

const duplicateError = (g: { name: string; phone: string }): FormState => ({
  error: `${g.name} (${g.phone}) is already on the guest list. If this is a different person, tick "Different person, same name" and save again.`,
  duplicate: true,
});

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
  const fns = await chosenFunctions(weddingId, fd);
  if (fns.error) return { error: fns.error };
  const same = await sameNameGuest(weddingId, result.name, fd);
  if (same) return duplicateError(same);

  try {
    await prisma.guest.create({
      data: {
        ...result,
        weddingId,
        token: newGuestToken(),
        invitations: { create: fns.ids!.map((eventId) => ({ eventId })) },
      },
    });
  } catch (e) {
    if (isDuplicate(e)) return { error: `${result.phone} is already on the guest list.` };
    throw e;
  }
  revalidatePath(`/weddings/${weddingId}`, "layout");
  return { message: `Added ${result.name}.` };
}

const MAX_CSV_BYTES = 1024 * 1024;

export async function importGuests(weddingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  await requireOwnedWedding(planner.id, weddingId);
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." };
  if (file.size > MAX_CSV_BYTES) return { error: "File is larger than 1 MB." };

  const { guests, errors } = parseGuestCsv(await file.text());
  if (fd.get("sameNameOk") !== "on") {
    const existing = await prisma.guest.findMany({ where: { weddingId }, select: { name: true, phone: true } });
    const byKey = new Map(existing.map((g) => [nameKey(g.name), g]));
    for (const g of guests) {
      const other = byKey.get(nameKey(g.name));
      // Same phone is skipped later anyway; same name with another number is the likely double entry.
      if (other && other.phone !== g.phone) errors.push(`${g.name}: same name as ${other.name} (${other.phone}), already on the list or earlier in the file`);
      else if (!other) byKey.set(nameKey(g.name), g);
    }
    if (errors.length) errors.push('If these are different people with the same name, tick "Allow guests with the same name" and import again.');
  }
  // All-or-nothing: a planner fixes the file and re-uploads, instead of guessing which rows landed.
  if (errors.length) return { error: `Nothing imported. Fix ${errors.length} row(s):`, errors: errors.slice(0, 21) };

  const saved = await saveGuests(weddingId, guests);
  if (!saved) return { error: SAVE_RACE };
  const { added, skipped } = saved;
  revalidatePath(`/weddings/${weddingId}`);
  return {
    message: `Imported ${added} guest(s).` + (skipped.length ? ` Skipped ${skipped.length} already on the list.` : ""),
  };
}

// Public: the guest's invite token is the only credential.
export async function saveRsvp(token: string, _: FormState, fd: FormData): Promise<FormState> {
  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { invitations: true, wedding: { include: { events: true } } },
  });
  if (!guest) return { error: "This invite link is not valid. Ask the family for a new one." };
  // Only functions this guest is invited to and whose day hasn't come; anything else in the form is ignored.
  const open = invitedEvents(guest, guest.wedding.events).filter((e) => isEventOpen(e, guest.wedding.rsvpDeadline));
  if (open.length === 0) return { error: "Replies are closed. Contact the family to change your plans." };

  const { rsvps, errors } = parseRsvpForm(open, (key) => String(fd.get(key) ?? ""));
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

// Shared by add and edit. Date and time are entered in IST.
function parseEventForm(fd: FormData) {
  const name = text(fd, "name");
  const date = text(fd, "date");
  const time = text(fd, "time");
  const venue = text(fd, "venue") || null;
  if (!name) return "Function name is required.";
  if (name.length > 60) return "Function name is too long.";
  const startsAt = new Date(`${date}T${time}:00+05:30`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || isNaN(startsAt.getTime()))
    return "Enter a valid date and time.";
  return { name, startsAt, venue };
}

export async function addEvent(weddingId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  await requireOwnedWedding(planner.id, weddingId);
  const data = parseEventForm(fd);
  if (typeof data === "string") return { error: data };
  const past = pastProblem(data.startsAt, "function");
  if (past) return { error: past };
  const wedding = await prisma.wedding.findUniqueOrThrow({ where: { id: weddingId }, select: { rsvpDeadline: true } });
  const late = deadlineProblem(wedding.rsvpDeadline, [data]);
  if (late) return { error: `${late} Move the deadline earlier in Settings, or pick a later date.` };

  await prisma.event.create({ data: { weddingId, ...data } });
  revalidatePath(`/weddings/${weddingId}`);
  return { message: `Added ${data.name}.` };
}


export async function updateEvent(eventId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  const event = await findOwnedEvent(planner.id, eventId);
  if (!event) return { error: "Function not found." };
  const data = parseEventForm(fd);
  if (typeof data === "string") return { error: data };
  // A function that already happened can still be renamed; only a new or changed time must be in the future.
  const past = pastProblem(data.startsAt, "function", new Date(), event.startsAt);
  if (past) return { error: past };
  const wedding = await prisma.wedding.findUniqueOrThrow({ where: { id: event.weddingId }, select: { rsvpDeadline: true } });
  const late = deadlineProblem(wedding.rsvpDeadline, [data]);
  if (late) return { error: `${late} Move the deadline earlier in Settings, or pick a later date.` };

  await prisma.event.update({ where: { id: eventId }, data });
  revalidatePath(`/weddings/${event.weddingId}`, "layout");
  return { message: "Saved." };
}

// Also deletes every reply for this function (cascade). The button asks first.
export async function deleteEvent(eventId: string) {
  const planner = await requirePlanner();
  const event = await findOwnedEvent(planner.id, eventId);
  if (!event) return;
  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath(`/weddings/${event.weddingId}`, "layout");
  redirect(`/weddings/${event.weddingId}`);
}

export async function updateGuest(guestId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  const guest = await findOwnedGuest(planner.id, guestId);
  if (!guest) return { error: "Guest not found." };
  const result = validateGuest({
    name: text(fd, "name"),
    phone: text(fd, "phone"),
    side: text(fd, "side"),
    relation: text(fd, "relation"),
  });
  if (typeof result === "string") return { error: result };
  const fns = await chosenFunctions(guest.weddingId, fd);
  if (fns.error) return { error: fns.error };
  const same = await sameNameGuest(guest.weddingId, result.name, fd, guestId);
  if (same) return duplicateError(same);

  try {
    // Token stays the same, so links already sent keep working. Invitations are replaced with the new choice.
    await prisma.$transaction([
      prisma.guest.update({ where: { id: guestId }, data: result }),
      prisma.invitation.deleteMany({ where: { guestId } }),
      prisma.invitation.createMany({ data: fns.ids!.map((eventId) => ({ guestId, eventId })) }),
    ]);
  } catch (e) {
    if (isDuplicate(e)) return { error: `Another guest on this wedding already has ${result.phone}.` };
    throw e;
  }
  revalidatePath(`/weddings/${guest.weddingId}`, "layout");
  return { message: "Saved." };
}

// Also deletes the guest's replies (cascade), and their invite link stops working. The button asks first.
export async function deleteGuest(guestId: string) {
  const planner = await requirePlanner();
  const guest = await findOwnedGuest(planner.id, guestId);
  if (!guest) return;
  await prisma.guest.delete({ where: { id: guestId } });
  revalidatePath(`/weddings/${guest.weddingId}`, "layout");
  redirect(`/weddings/${guest.weddingId}`);
}

// Called when the planner clicks a WhatsApp invite / reminder button. Best effort: a click, not proof of delivery.
export async function markSent(guestId: string, kind: "invite" | "reminder") {
  if (kind !== "invite" && kind !== "reminder") return; // bound args come from the client, so check them
  const planner = await requirePlanner();
  const guest = await findOwnedGuest(planner.id, guestId);
  if (!guest) return;
  const now = new Date();
  await prisma.guest.update({
    where: { id: guestId },
    data: kind === "invite" ? { invitedAt: now } : { remindedAt: now, reminderCount: { increment: 1 } },
  });
  revalidatePath(`/weddings/${guest.weddingId}`, "layout"); // wedding page and the send queue
}

export async function recordActual(eventId: string, _: FormState, fd: FormData): Promise<FormState> {
  const planner = await requirePlanner();
  const event = await prisma.event.findFirst({
    where: { id: eventId, wedding: { plannerId: planner.id } }, // same scoping as findOwnedEvent, plus startsAt
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

// Door list: one tap per person arriving. Both ids are checked against the planner and must be the same wedding.
export async function checkInGuest(eventId: string, guestId: string, step: number) {
  const planner = await requirePlanner();
  const [event, guest] = await Promise.all([findOwnedEvent(planner.id, eventId), findOwnedGuest(planner.id, guestId)]);
  if (!event || !guest || event.weddingId !== guest.weddingId || !doorOpen(event)) return;
  await checkIn(eventId, guestId, step < 0 ? -1 : 1); // bound arguments come from the client, so clamp
  revalidatePath(`/weddings/${event.weddingId}`, "layout");
}

// Shared invite link: "on" makes a code if there is none, "new" replaces it (the old link stops working), "off" removes it.
export async function setJoinLink(weddingId: string, mode: string) {
  const planner = await requirePlanner();
  const wedding = await requireOwnedWedding(planner.id, weddingId);
  const joinCode = mode === "off" ? null : mode === "new" || !wedding.joinCode ? newGuestToken() : wedding.joinCode;
  await prisma.wedding.update({ where: { id: weddingId }, data: { joinCode } });
  revalidatePath(`/weddings/${weddingId}`);
}

// A guest who opened the shared link adds themself (invited to every function), then lands on their own
// invitation to reply. A number already on the list is refused: otherwise anyone could take over that guest's reply.
export async function joinWedding(code: string, _: FormState, fd: FormData): Promise<FormState> {
  const wedding = await prisma.wedding.findUnique({ where: { joinCode: code }, select: { id: true } });
  if (!wedding) return { error: "This invite link is no longer active. Ask the family for a new one." };
  if (!(await allow("join", 20))) return { error: "Too many replies from this network. Please try again in an hour." };
  const result = validateGuest({ name: text(fd, "name"), phone: text(fd, "phone"), side: text(fd, "side"), relation: "other" });
  if (typeof result === "string") return { error: result.charAt(0).toUpperCase() + result.slice(1) + "." };
  const token = newGuestToken();
  try {
    await prisma.guest.create({ data: { ...result, weddingId: wedding.id, token, invitedAt: new Date() } });
  } catch (e) {
    if (isDuplicate(e))
      return { error: "This number is already on the guest list. Open the invite the family sent you on WhatsApp." };
    throw e;
  }
  revalidatePath(`/weddings/${wedding.id}`, "layout");
  redirect(`/r/${token}`);
}
