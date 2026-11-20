import { ImageResponse } from "next/og";
import { THEMES, coupleNames, dateSpan, themeOf } from "@/lib/invitation";

export const ogSize = { width: 1200, height: 630 };

type Wedding = { name: string; city: string | null; theme: string; brideName: string | null; groomName: string | null };

// The preview card WhatsApp shows under an invite link: the couple, the dates and the functions, in the wedding's theme.
// Only wedding details, never the guest's name: the image is fetched by the chat app's servers.
export function inviteCard(wedding: Wedding, events: { name: string; startsAt: Date }[]) {
  const theme = THEMES.find((t) => t.id === themeOf(wedding.theme))!;
  const ink = theme.id === "ivory" ? "#3a1418" : "#fbf3e2";
  const couple = coupleNames(wedding);
  const title = couple ? `${couple[0]} & ${couple[1]}` : wedding.name;
  const when = [dateSpan(events), wedding.city].filter(Boolean).join(" · ");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: theme.deep, padding: 28, fontFamily: "serif" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: `3px solid ${theme.gold}`,
            borderRadius: 18,
            color: ink,
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          <div style={{ fontSize: 26, letterSpacing: 10, color: theme.gold, fontFamily: "sans-serif" }}>YOU&apos;RE INVITED</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 26, color: theme.gold }}>
            <div style={{ width: 90, height: 2, background: theme.gold }} />
            <div style={{ width: 10, height: 10, borderRadius: 10, background: theme.gold }} />
            <div style={{ width: 90, height: 2, background: theme.gold }} />
          </div>
          <div style={{ marginTop: 30, fontSize: title.length > 26 ? 64 : 84, lineHeight: 1.05, fontStyle: "italic" }}>{title}</div>
          {when && <div style={{ marginTop: 30, fontSize: 32, fontFamily: "sans-serif", opacity: 0.9 }}>{when}</div>}
          {events.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 34, fontFamily: "sans-serif" }}>
              {events.slice(0, 5).map((e, i) => (
                <div key={i} style={{ fontSize: 24, padding: "8px 20px", borderRadius: 40, border: `2px solid ${theme.gold}`, color: theme.gold }}>
                  {e.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    ogSize,
  );
}
