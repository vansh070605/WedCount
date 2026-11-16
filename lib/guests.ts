import { randomBytes } from "node:crypto";

export const SIDES = ["bride", "groom"] as const;

// 128 random bits, URL-safe. The invite link is the guest's only credential.
export const newGuestToken = () => randomBytes(16).toString("base64url");
// Comparable form of a name, to catch the same person added twice ("Sharma  Uncle." = "sharma uncle").
export const nameKey = (name: string) =>
  name.toLowerCase().replace(/[.,'"]/g, "").replace(/\s+/g, " ").trim();

export const RELATIONS = ["family", "friend", "colleague", "other"] as const;

export type GuestInput = {
  name: string;
  phone: string;
  side: (typeof SIDES)[number];
  relation: (typeof RELATIONS)[number];
};

// Indian mobile numbers only: accepts "98765 43210", "+91-98765-43210", "098765 43210".
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

export function validateGuest(raw: Record<string, string>): GuestInput | string {
  const name = (raw.name ?? "").trim();
  const phone = normalizePhone(raw.phone ?? "");
  const side = (raw.side ?? "").trim().toLowerCase();
  const relation = ((raw.relation ?? "").trim().toLowerCase() || "other");
  if (!name) return "name is missing";
  if (name.length > 100) return "name is too long";
  if (!phone) return `"${raw.phone ?? ""}" is not a valid Indian mobile number`;
  if (!SIDES.includes(side as GuestInput["side"])) return `side must be bride or groom, got "${raw.side ?? ""}"`;
  if (!RELATIONS.includes(relation as GuestInput["relation"]))
    return `relation must be one of ${RELATIONS.join(", ")}, got "${raw.relation}"`;
  return { name, phone, side: side as GuestInput["side"], relation: relation as GuestInput["relation"] };
}

export type CsvResult = { guests: GuestInput[]; errors: string[] };

// Splits CSV text into rows of cells (RFC 4180): quoted fields may hold commas, newlines and "" for a quote.
// Each row keeps the file line it starts on, so errors can point at the right line. Blank rows are dropped.
export function parseCsv(text: string): { cells: string[]; line: number }[] {
  const rows: { cells: string[]; line: number }[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  const endRow = () => {
    cells.push(cell);
    if (cells.some((c) => c.trim() !== "")) rows.push({ cells, line: rowLine });
    cells = [];
    cell = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else {
        if (ch === "\n") line++;
        cell += ch;
      }
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(cell);
      cell = "";
    }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
      line++;
      rowLine = line;
    } else cell += ch;
  }
  endRow();
  return rows;
}

// Header row required: name,phone,side,relation (any order, relation optional).
export function parseGuestCsv(text: string): CsvResult {
  const rows = parseCsv(text);
  if (rows.length === 0) return { guests: [], errors: ["File is empty"] };

  const header = rows[0].cells.map((h) => h.trim().toLowerCase());
  const missing = ["name", "phone", "side"].filter((h) => !header.includes(h));
  if (missing.length) return { guests: [], errors: [`Header is missing: ${missing.join(", ")}`] };

  const guests: GuestInput[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const { cells, line } of rows.slice(1)) {
    const row = Object.fromEntries(header.map((h, j) => [h, (cells[j] ?? "").trim()]));
    const result = validateGuest(row);
    if (typeof result === "string") errors.push(`Row ${line}: ${result}`);
    else if (seen.has(result.phone)) errors.push(`Row ${line}: duplicate phone ${result.phone}`);
    else {
      seen.add(result.phone);
      guests.push(result);
    }
  }
  return { guests, errors };
}
