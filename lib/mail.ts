import "server-only";

// Sends one email through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
// Without RESEND_API_KEY, development prints the email to the server console instead; production logs an error.
export async function sendEmail(msg: { to: string; subject: string; text: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[mail] RESEND_API_KEY not set; would send to ${msg.to}:\n${msg.subject}\n${msg.text}`);
      return true;
    }
    console.error(JSON.stringify({ level: "error", message: "RESEND_API_KEY is not set; email not sent" }));
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM || "WedCount <onboarding@resend.dev>", ...msg, to: [msg.to] }),
  });
  if (!res.ok) {
    // Status and Resend's error text only; never the message body, which holds the reset link.
    console.error(JSON.stringify({ level: "error", message: "Resend rejected email", status: res.status, detail: (await res.text()).slice(0, 300) }));
    return false;
  }
  return true;
}
