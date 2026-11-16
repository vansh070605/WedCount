import { createHash, randomBytes } from "node:crypto";

// Password reset links: 256 random bits, valid for 30 minutes, usable once.
export const RESET_MINUTES = 30;

export const newResetToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const resetExpiry = (now = new Date()) => new Date(now.getTime() + RESET_MINUTES * 60 * 1000);

export const isUsable = (row: { expiresAt: Date; usedAt: Date | null } | null, now = new Date()): boolean =>
  !!row && !row.usedAt && row.expiresAt > now;

// Same reply whether or not the email has an account, so the form can't be used to find planners.
export const RESET_SENT = `If an account uses that email, a reset link is on its way. It works for ${RESET_MINUTES} minutes.`;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function resetEmail({ name, link }: { name: string; link: string }) {
  const subject = "Reset your WedCount password";
  const text = [
    `Hi ${name},`,
    "",
    "Someone asked to reset the password for your WedCount account. If it was you, open this link to choose a new one:",
    link,
    "",
    `The link works once and expires in ${RESET_MINUTES} minutes. If you didn't ask for this, ignore this email; your password stays the same.`,
  ].join("\n");
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#0b1220;max-width:480px">
<p>Hi ${escape(name)},</p>
<p>Someone asked to reset the password for your WedCount account. If it was you, choose a new one:</p>
<p><a href="${escape(link)}" style="display:inline-block;background:#0b1220;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Choose a new password</a></p>
<p style="color:#5a6475;font-size:13px">The link works once and expires in ${RESET_MINUTES} minutes. If you didn't ask for this, ignore this email; your password stays the same.</p>
</div>`;
  return { subject, text, html };
}
