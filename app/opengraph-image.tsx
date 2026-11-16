import { ImageResponse } from "next/og";

export const alt = "WedCount: WhatsApp RSVPs and an expected headcount for every function of an Indian wedding";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The card shown when a WedCount link is shared on WhatsApp, LinkedIn or X.
export default function OpenGraphImage() {
  const rows = [
    ["Haldi", "86", "84", "76–92"],
    ["Sangeet", "230", "212", "196–228"],
    ["Wedding", "312", "289", "270–308"],
  ];
  const bar = (height: number, background: string) => <div style={{ width: 10, height, background, borderRadius: 3 }} />;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#faf6ef", display: "flex", padding: 64, gap: 56, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, background: "#3a1418", borderRadius: 13, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6, paddingBottom: 13 }}>
              {bar(12, "rgba(255,255,255,0.55)")}
              {bar(19, "rgba(255,255,255,0.8)")}
              {bar(26, "#e7b04a")}
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#3a1418" }}>WedCount</div>
          </div>
          <div style={{ marginTop: 56, fontSize: 60, lineHeight: 1.08, fontWeight: 700, color: "#3a1418", letterSpacing: -2 }}>
            WhatsApp RSVPs and an expected headcount for every function.
          </div>
          <div style={{ marginTop: 28, fontSize: 26, color: "#6e5d54" }}>For Indian wedding planners</div>
        </div>
        <div style={{ width: 430, display: "flex", flexDirection: "column", background: "#ffffff", border: "2px solid #eadfcf", borderRadius: 20, padding: 28, alignSelf: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#3a1418" }}>Priya & Rohit</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 18, color: "#6e5d54", borderBottom: "2px solid #eadfcf", paddingBottom: 10 }}>
            <div style={{ width: 130 }}>Function</div>
            <div style={{ width: 100 }}>Coming</div>
            <div>Expected</div>
          </div>
          {rows.map(([fn, coming, expected, range]) => (
            <div key={fn} style={{ display: "flex", alignItems: "baseline", fontSize: 22, color: "#3a1418", paddingTop: 16 }}>
              <div style={{ width: 130 }}>{fn}</div>
              <div style={{ width: 100 }}>{coming}</div>
              <div style={{ fontWeight: 700, color: "#8c1c33" }}>{expected}</div>
              <div style={{ marginLeft: 8, fontSize: 17, color: "#6e5d54" }}>{range}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
