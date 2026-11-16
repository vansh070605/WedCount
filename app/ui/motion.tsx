"use client";

import { ViewTransition, useEffect, useRef } from "react";

// Numbers count up from zero the first time they appear. The server renders the final value, so it reads
// correctly before scripts load and for reduced motion.
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || value <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const ms = Math.min(1200, 500 + value * 20);
      raf = requestAnimationFrame(function step(t) {
        const p = Math.min(1, (t - start) / ms);
        node.textContent = `${Math.round(value * (1 - (1 - p) ** 3))}${suffix}`;
        if (p < 1) raf = requestAnimationFrame(step);
      });
    };
    // Start when the number scrolls into view; below the fold it waits at 0, out of sight.
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      run();
    });
    if (node.getBoundingClientRect().top > innerHeight) node.textContent = `0${suffix}`;
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
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
