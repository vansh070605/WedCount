// Public base URL of the app, used in links sent to guests.
export function appUrl(): string {
  const url = process.env.APP_URL;
  // A missing value in production would send guests localhost links, so fail loudly instead.
  if (!url && process.env.NODE_ENV === "production") throw new Error("APP_URL is not set");
  return (url || "http://localhost:3000").replace(/\/+$/, "");
}

export const inviteLink = (token: string, base = appUrl()) => `${base}/r/${token}`;

export function inviteMessage(opts: { guestName: string; weddingName: string; link: string; deadline: Date | null }) {
  const by = opts.deadline
    ? ` by ${opts.deadline.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long" })}`
    : "";
  return (
    `Namaste ${opts.guestName}! You're invited to ${opts.weddingName}.\n\n` +
    `Please tell us which functions you'll attend and how many of you are coming${by}:\n${opts.link}\n\n` +
    `You can change your reply anytime before then.`
  );
}

export function reminderMessage(opts: {
  guestName: string;
  weddingName: string;
  link: string;
  deadline: Date | null;
  missing: string[]; // function names the guest hasn't answered
}) {
  const by = opts.deadline
    ? ` by ${opts.deadline.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long" })}`
    : "";
  const what = opts.missing.length ? ` for ${listJoin(opts.missing)}` : "";
  return (
    `Namaste ${opts.guestName}, a gentle reminder for ${opts.weddingName}. ` +
    `We haven't received your reply${what} yet.\n\n` +
    `Please let us know${by} so we can plan the food:\n${opts.link}`
  );
}

// "A", "A and B", "A, B and C"
const listJoin = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

// Opens WhatsApp (app or web) with the message ready to send to this number. Phone is stored as +91XXXXXXXXXX.
export const whatsappUrl = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
