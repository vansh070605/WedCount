export const SIDES = ["bride", "groom"] as const;
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

// Header row required: name,phone,side,relation (any order, relation optional).
// shortcut: no quoted fields, so names can't contain commas; switch to a CSV library if planners hit that.
export function parseGuestCsv(text: string): CsvResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { guests: [], errors: ["File is empty"] };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const missing = ["name", "phone", "side"].filter((h) => !header.includes(h));
  if (missing.length) return { guests: [], errors: [`Header is missing: ${missing.join(", ")}`] };

  const guests: GuestInput[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  lines.slice(1).forEach((line, i) => {
    const cells = line.split(",");
    const row = Object.fromEntries(header.map((h, j) => [h, (cells[j] ?? "").trim()]));
    const result = validateGuest(row);
    const rowNo = i + 2; // 1-based, after header
    if (typeof result === "string") errors.push(`Row ${rowNo}: ${result}`);
    else if (seen.has(result.phone)) errors.push(`Row ${rowNo}: duplicate phone ${result.phone}`);
    else {
      seen.add(result.phone);
      guests.push(result);
    }
  });
  return { guests, errors };
}
