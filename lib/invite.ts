import { deadlineText } from "./rsvp";

// Public base URL of the app, used in links sent to guests.
export function appUrl(): string {
  const url = process.env.APP_URL;
  // A missing value in production would send guests localhost links, so fail loudly instead.
  if (!url && process.env.NODE_ENV === "production") throw new Error("APP_URL is not set");
  return (url || "http://localhost:3000").replace(/\/+$/, "");
}

export const inviteLink = (token: string, base = appUrl()) => `${base}/r/${token}`;

// The planner can rewrite the WhatsApp invite. Placeholders are filled per guest; {link} is required.
export const PLACEHOLDERS = ["name", "wedding", "functions", "schedule", "replyBy", "link"] as const;
export const MAX_TEMPLATE = 1000;
// WhatsApp formatting: *bold*, _italic_. {schedule} lists each function on its own lines.
export const DEFAULT_INVITE_TEMPLATE =
  "Namaste {name}!\n\n" +
  "With joy, we invite you to celebrate *{wedding}*.\n\n" +
  "{schedule}\n\n" +
  "Kindly reply {replyBy} so we can plan for you:\n{link}\n\n" +
  "_You can change your reply anytime before then._";

export type InviteEvent = { name: string; startsAt: Date; venue?: string | null };

const when = (d: Date) =>
  d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// *Haldi*
// Thu, 10 Dec, 10:00 am · Family home
export const schedule = (events: InviteEvent[]) =>
  events.map((e) => `*${e.name}*\n${when(e.startsAt)}${e.venue ? ` · ${e.venue}` : ""}`).join("\n\n");

// Empty when fine, otherwise what to fix.
export function templateProblem(template: string): string | null {
  if (template.length > MAX_TEMPLATE) return `Keep the message under ${MAX_TEMPLATE} characters.`;
  if (!template.includes("{link}")) return "The message must include {link}, or guests can't reply.";
  const unknown = [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((k) => !(PLACEHOLDERS as readonly string[]).includes(k));
  return unknown.length ? `Unknown placeholder: {${unknown[0]}}. Use ${PLACEHOLDERS.map((p) => `{${p}}`).join(", ")}.` : null;
}

export function inviteMessage(opts: {
  guestName: string;
  weddingName: string;
  link: string;
  deadline: Date | null;
  functions?: InviteEvent[]; // the functions this guest is invited to
  template?: string | null;
}) {
  const fns = opts.functions ?? [];
  const values: Record<string, string> = {
    name: opts.guestName,
    wedding: opts.weddingName,
    functions: fns.length ? `the ${listJoin(fns.map((e) => e.name))}` : "the wedding",
    schedule: fns.length ? schedule(fns) : "",
    replyBy: opts.deadline ? `by ${deadlineText(opts.deadline)}` : "as soon as you can",
    link: opts.link,
  };
  const text = (opts.template || DEFAULT_INVITE_TEMPLATE).replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
  return text.replace(/\n{3,}/g, "\n\n"); // an empty {schedule} leaves no gap
}

// The message for the wedding's shared link, for chats and groups: the same schedule, one link for everyone.
export function joinMessage(opts: { weddingName: string; city: string | null; link: string; events: InviteEvent[]; deadline: Date | null }) {
  return [
    `You're invited to celebrate *${opts.weddingName}*${opts.city ? ` in ${opts.city}` : ""}!`,
    opts.events.length ? schedule(opts.events) : "",
    `Open your invitation and reply${opts.deadline ? ` by ${deadlineText(opts.deadline)}` : ""}:\n${opts.link}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function reminderMessage(opts: {
  guestName: string;
  weddingName: string;
  link: string;
  deadline: Date | null;
  missing: string[]; // function names the guest hasn't answered
}) {
  const by = opts.deadline ? ` by ${deadlineText(opts.deadline)}` : "";
  const what = opts.missing.length ? ` for ${listJoin(opts.missing)}` : "";
  return (
    `Namaste ${opts.guestName}, a gentle reminder for ${opts.weddingName}. ` +
    `We haven't received your reply${what} yet.\n\n` +
    `Please let us know${by} so we can plan the food:\n${opts.link}`
  );
}

// "A", "A and B", "A, B and C"
export const listJoin = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

// Opens WhatsApp (app or web) with the message ready to send to this number. Phone is stored as +91XXXXXXXXXX.
export const whatsappUrl = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
