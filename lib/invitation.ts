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

export const MAX_FAMILY = 120;
