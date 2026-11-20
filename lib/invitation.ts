// Look and wording of the guest invitation. Pure, so it can be unit-tested and used by client components.

// Each theme sets the invitation's colours (see [data-invite] in app/globals.css).
export const THEMES = [
  { id: "royal", name: "Royal Blue & Gold", deep: "#14245e", gold: "#d4a94e" },
  { id: "sindoor", name: "Sindoor Red & Gold", deep: "#7a1020", gold: "#d9a640" },
  { id: "mehendi", name: "Mehendi Green & Gold", deep: "#1f4a33", gold: "#d6ae55" },
  { id: "ivory", name: "Ivory & Rose Gold", deep: "#f4e9df", gold: "#b5765a" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export const themeOf = (id: string | null | undefined): ThemeId =>
  THEMES.some((t) => t.id === id) ? (id as ThemeId) : "royal";

// A colour per kind of function, so Haldi looks like Haldi everywhere. Unknown names use the theme's gold.
const TONES: [RegExp, string][] = [
  [/haldi|pithi|mayun/i, "#e0a800"],
  [/mehendi|mehndi|henna/i, "#3f7d3a"],
  [/sangeet|garba|dandiya/i, "#7b3fa0"],
  [/cocktail|party/i, "#1f7a8c"],
  [/reception/i, "#b8862b"],
  [/engagement|sagai|roka|ring/i, "#c0506a"],
  [/wedding|shaadi|vivah|pheras|muhurtham|nikah|anand karaj/i, "#b3122e"],
];
export const functionTone = (name: string) => TONES.find(([re]) => re.test(name))?.[1] ?? null;

// Couple's names for the big script heading: explicit names first, else split "Priya & Rohit".
export function coupleNames(w: { name: string; brideName?: string | null; groomName?: string | null }): [string, string] | null {
  if (w.brideName && w.groomName) return [w.brideName, w.groomName];
  const parts = w.name.replace(/^.*?:\s*/, "").split(/\s*(?:&|\band\b|\bweds\b|∞|\+)\s*/i).filter(Boolean);
  return parts.length === 2 ? [parts[0], parts[1]] : null;
}

// Initials for the wax seal: "P R" for Priya & Rohit, else the first two letters of the wedding name.
export function initials(w: { name: string; brideName?: string | null; groomName?: string | null }) {
  const c = coupleNames(w);
  if (c) return `${c[0][0]}${c[1][0]}`.toUpperCase();
  return w.name.replace(/[^\p{L}]/gu, "").slice(0, 2).toUpperCase() || "W";
}

export const mapsUrl = (venue: string, city?: string | null) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, city].filter(Boolean).join(", "))}`;

// A pasted Google Maps link, or an error. Only Google Maps hosts, so a guest's "Directions" button can't be
// pointed at an arbitrary site.
const MAP_HOSTS = ["maps.app.goo.gl", "goo.gl", "maps.google.com", "google.com", "www.google.com", "www.google.co.in", "google.co.in"];
export function parseMapLink(raw: string): { url: string } | { error: string } {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return { error: "Paste the full Google Maps link, starting with https://" };
  }
  const ok =
    u.protocol === "https:" &&
    MAP_HOSTS.includes(u.hostname) &&
    (u.hostname.startsWith("maps.") || u.pathname.startsWith("/maps"));
  if (!ok || raw.length > 500) return { error: "Use a Google Maps link (Share → Copy link in Google Maps)." };
  return { url: u.toString() };
}

// "Add to Google Calendar" for one function; assumes it lasts 3 hours.
export function calendarUrl(e: { name: string; startsAt: Date; venue?: string | null }, wedding: string) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = new Date(e.startsAt.getTime() + 3 * 60 * 60 * 1000);
  const q = new URLSearchParams({ action: "TEMPLATE", text: `${e.name} · ${wedding}`, dates: `${fmt(e.startsAt)}/${fmt(end)}` });
  if (e.venue) q.set("location", e.venue);
  return `https://calendar.google.com/calendar/render?${q}`;
}

// "10–11 December 2026", "28 November – 2 December 2026", or one date. Events are in date order.
export function dateSpan(events: { startsAt: Date }[]) {
  if (!events.length) return "";
  const part = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...o });
  const [a, b] = [events[0].startsAt, events.at(-1)!.startsAt];
  const full = (d: Date) => part(d, { day: "numeric", month: "long", year: "numeric" });
  if (full(a) === full(b)) return full(a);
  if (part(a, { month: "long", year: "numeric" }) === part(b, { month: "long", year: "numeric" }))
    return `${part(a, { day: "numeric" })}–${full(b)}`;
  return `${part(a, { day: "numeric", month: "long" })} – ${full(b)}`;
}

// Title and description for a shared invite link's preview (the image comes from opengraph-image.tsx).
export function inviteMeta(w: { name: string; city: string | null; brideName?: string | null; groomName?: string | null }, events: { name: string; startsAt: Date }[]) {
  const c = coupleNames(w);
  const title = `You're invited · ${c ? `${c[0]} & ${c[1]}` : w.name}`;
  const description = [events.map((e) => e.name).join(", "), dateSpan(events), w.city].filter(Boolean).join(" · ");
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image" as const, title, description } };
}

export const MAX_FAMILY = 120;
