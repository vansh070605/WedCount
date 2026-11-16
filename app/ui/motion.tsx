"use client";

import { ViewTransition, useEffect, useRef } from "react";

// Numbers count up from zero the first time they appear. The server renders the final value, so it reads
// correctly before scripts load and for reduced motion.
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || value <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const ms = Math.min(1200, 500 + value * 20);
    let raf = requestAnimationFrame(function step(t) {
      const p = Math.min(1, (t - start) / ms);
      node.textContent = `${Math.round(value * (1 - (1 - p) ** 3))}${suffix}`;
      if (p < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [value, suffix]);
  return (
    <span ref={el}>
      {value}
      {suffix}
    </span>
  );
}

// Planner pages fade and rise into place when you move between them (React's View Transitions);
// the header outside this wrapper stays still. Browsers without support simply swap pages.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <ViewTransition default="page-fade">{children}</ViewTransition>;
}
