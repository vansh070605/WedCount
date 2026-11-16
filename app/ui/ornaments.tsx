// Hand-drawn wedding ornaments as inline SVG. They take currentColor (and --inv-* colours on the invitation),
// so one drawing works in every theme. All decorative: aria-hidden.
import type { CSSProperties } from "react";

// Toran: a string of marigold blooms with mango leaves, repeated across the full width.
export function Garland({ className = "h-7 w-full", style, id = "toran" }: { className?: string; style?: CSSProperties; id?: string }) {
  return (
    <svg aria-hidden className={className} style={style} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="64" height="28" patternUnits="userSpaceOnUse">
          <path d="M0 4 Q16 14 32 4 T64 4" fill="none" stroke="#8a5a1c" strokeWidth="1" opacity="0.6" />
          <path d="M28 7 q4 9 0 14 q-4 -5 0 -14z" fill="#3f7d3a" opacity="0.85" />
          <g transform="translate(16 10)">
            {[0, 60, 120, 180, 240, 300].map((r) => (
              <ellipse key={r} cx="0" cy="-4" rx="2.6" ry="4.2" fill="#f2a516" transform={`rotate(${r})`} />
            ))}
            <circle r="2.6" fill="#e36a0c" />
          </g>
          <g transform="translate(48 10)">
            {[30, 90, 150, 210, 270, 330].map((r) => (
              <ellipse key={r} cx="0" cy="-4" rx="2.6" ry="4.2" fill="#f6c02a" transform={`rotate(${r})`} />
            ))}
            <circle r="2.6" fill="#ef8f12" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="28" fill={`url(#${id})`} />
    </svg>
  );
}

export function Diya({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path d="M24 6c4 6 5 10 0 15-5-5-4-9 0-15z" fill="#f6b52a" />
      <path d="M24 11c2 3 2.5 5 0 7.5-2.5-2.5-2-4.5 0-7.5z" fill="#fff3c4" />
      <path d="M6 26h36c-2 9-9 14-18 14S8 35 6 26z" fill="currentColor" />
      <path d="M10 26h28" stroke="#f6b52a" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 40h14l-2 3H19z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

// A small lotus-and-line divider between sections.
export function Divider({ className = "w-56" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 24" aria-hidden className={className} fill="none" stroke="currentColor">
      <path d="M0 12h88M152 12h88" strokeWidth="1" opacity="0.7" />
      <circle cx="94" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="146" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M120 3c5 4 6 9 0 16-6-7-5-12 0-16z" strokeWidth="1.2" />
      <path d="M120 19c-7-1-13-4-15-9 6 0 11 3 15 9zM120 19c7-1 13-4 15-9-6 0-11 3-15 9z" strokeWidth="1.2" />
    </svg>
  );
}

// Quarter mandala for card corners; rotate for the other three.
export function MandalaCorner({ className = "size-16", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M2 62V2h60" opacity="0.6" />
      <path d="M2 40a22 22 0 0 0 22-22" />
      <path d="M2 28a12 12 0 0 0 12-12" />
      {[10, 30, 50, 70].map((a) => (
        <ellipse key={a} cx="2" cy="2" rx="4" ry="14" transform={`translate(2 2) rotate(-${a}) translate(0 16)`} opacity="0.8" />
      ))}
      <circle cx="2" cy="2" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

// The couple under a floral arch: an illustration, not a photo, coloured by the invitation's theme.
export function CoupleArt({ className = "w-56" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 260" aria-hidden className={className}>
      {/* arch */}
      <path d="M30 250V110a90 90 0 0 1 180 0v140" fill="none" stroke="var(--inv-gold)" strokeWidth="3" />
      <path d="M44 250V112a76 76 0 0 1 152 0v138" fill="none" stroke="var(--inv-gold)" strokeWidth="1" opacity="0.6" />
      {Array.from({ length: 13 }, (_, i) => {
        const a = Math.PI - (i * Math.PI) / 12;
        return <circle key={i} cx={120 + 90 * Math.cos(a)} cy={110 - 90 * Math.sin(a)} r="6" fill={i % 2 ? "#f6c02a" : "#ef8f12"} />;
      })}
      {/* groom */}
      <g transform="translate(140 96)">
        <path d="M-14 0q14-14 28 0l-2 6h-24z" fill="#c8342e" />
        <path d="M10 -6q6 -6 8 2" fill="none" stroke="#c8342e" strokeWidth="3" />
        <circle cx="0" cy="14" r="11" fill="#c98b62" />
        <path d="M-18 30h36l6 96h-48z" fill="#f2e3c6" />
        <path d="M-18 30h36l2 22h-40z" fill="#e6cf9f" />
        {[44, 60, 76].map((y) => (
          <circle key={y} cx="0" cy={y} r="1.8" fill="var(--inv-gold)" />
        ))}
        <path d="M-14 126h10v28h-10zM4 126h10v28H4z" fill="#ead9b8" />
        <path d="M-26 34q-8 30 2 50" fill="none" stroke="#f2e3c6" strokeWidth="9" strokeLinecap="round" />
        <path d="M-14 30q14 30 30 12" fill="none" stroke="#e36a0c" strokeWidth="2" opacity="0.8" />
      </g>
      {/* bride */}
      <g transform="translate(98 104)">
        <path d="M-12 6q12 -16 24 0v10h-24z" fill="#3a2016" />
        <circle cx="0" cy="12" r="10" fill="#d49a73" />
        <circle cx="0" cy="5" r="1.6" fill="#b3122e" />
        <path d="M-15 26h30l4 24h-38z" fill="#b3122e" />
        <path d="M-19 50h38l24 96h-86z" fill="#b3122e" />
        <path d="M-27 90h54M-36 126h72" stroke="var(--inv-gold)" strokeWidth="2.5" />
        <path d="M-12 0q-26 30 -36 146h22" fill="#d9435c" opacity="0.55" />
        <path d="M12 30q18 18 24 4" fill="none" stroke="#d49a73" strokeWidth="5" strokeLinecap="round" />
      </g>
      <path d="M20 250h200" stroke="var(--inv-gold)" strokeWidth="2" />
    </svg>
  );
}
