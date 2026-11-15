"use client";

import { useEffect, useRef } from "react";

// Counts a number up from 0 once, on mount. Renders the final value on the server, so it reads
// correctly without JS, and stays put for visitors who prefer reduced motion.
export function CountUp({ value, ms = 900 }: { value: number; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      el.textContent = Math.round(value * (1 - Math.pow(1 - p, 3))).toString();
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = value.toString();
    };
  }, [value, ms]);
  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}
