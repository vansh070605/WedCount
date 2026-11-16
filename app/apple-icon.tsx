import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon: the logo's three rising bars on ink.
export default function AppleIcon() {
  const bar = (height: number, background: string) => (
    <div style={{ width: 22, height, background, borderRadius: 5 }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0b1220", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, paddingBottom: 46 }}>
        {bar(40, "rgba(255,255,255,0.55)")}
        {bar(65, "rgba(255,255,255,0.8)")}
        {bar(90, "#8fb0ff")}
      </div>
    ),
    size,
  );
}
