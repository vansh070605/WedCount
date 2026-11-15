"use client";

import { useEffect } from "react";

const HOT = "a, button, summary, label, [role='button'], [role='radio']";
const TEXT = "input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea, select";

// A ring that trails the mouse and swells over anything clickable; it also feeds the pointer position to
// .spot cards for their glow. The real cursor stays visible. Mouse only: touch screens and visitors who
// prefer reduced motion get nothing.
export function Cursor() {
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.append(ring);

    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let raf = 0;

    const loop = () => {
      // Ease towards the pointer: a short, soft trail.
      rx += (x - rx) * 0.22;
      ry += (y - ry) * 0.22;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
      ring.toggleAttribute("data-visible", true);

      const target = e.target instanceof Element ? e.target : null;
      ring.dataset.hot = target?.closest(TEXT) ? "text" : target?.closest(HOT) ? "link" : "";

      const spot = target?.closest<HTMLElement>(".spot");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${x - r.left}px`);
        spot.style.setProperty("--my", `${y - r.top}px`);
      }
    };
    const onDown = () => ring.toggleAttribute("data-down", true);
    const onUp = () => ring.toggleAttribute("data-down", false);
    const onLeave = () => ring.toggleAttribute("data-visible", false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      ring.remove();
    };
  }, []);

  return null;
}
