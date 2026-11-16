"use client";

import { useEffect, useRef, useState } from "react";

// Days / hours / minutes / seconds to the first function. The server renders the days; the rest ticks once loaded.
export function Countdown({ to, initialDays }: { to: string; initialDays: number }) {
  const target = new Date(to).getTime();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);

  const parts =
    left == null
      ? [[initialDays, "Days"], ["--", "Hours"], ["--", "Minutes"], ["--", "Seconds"]]
      : [
          [Math.floor(left / 86400000), "Days"],
          [Math.floor(left / 3600000) % 24, "Hours"],
          [Math.floor(left / 60000) % 60, "Minutes"],
          [Math.floor(left / 1000) % 60, "Seconds"],
        ];
  if (left === 0) return <p className="font-[family-name:var(--font-script)] text-3xl">Today is the day!</p>;
  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="timer" aria-label={`${parts[0][0]} days to go`}>
      {parts.map(([n, label]) => (
        <div key={label} className="w-16 rounded-xl border border-[var(--inv-gold)]/50 bg-white/80 py-2.5 text-center shadow-sm sm:w-20">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl" style={{ color: "var(--brand)" }}>
            <span key={String(n)} className="tick inline-block">
              {typeof n === "number" ? String(n).padStart(2, "0") : n}
            </span>
          </p>
          <p className="mt-0.5 text-[9px] tracking-[0.1em] text-[var(--inv-ink)]/60 uppercase">{label}</p>
        </div>
      ))}
    </div>
  );
}

// Gold foil over the date: scratch it with a finger or mouse. Once about half is cleared, the foil falls away.
// Keyboard and screen-reader users get a Reveal button; before scripts load the foil is plain CSS.
export function ScratchCard({ children }: { children: React.ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const foil = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    // Reduced motion: no scratching game, the date simply shows.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      c.parentElement?.querySelectorAll<HTMLElement>("[data-cover]").forEach((el) => (el.style.display = "none"));
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = c.getBoundingClientRect();
    c.width = width * ratio;
    c.height = height * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    const g = ctx.createLinearGradient(0, 0, width, height);
    [["#b8892e", 0], ["#f3d98b", 0.35], ["#c99a3d", 0.55], ["#f6e3a1", 0.75], ["#a77a26", 1]].forEach(([col, at]) =>
      g.addColorStop(at as number, col as string),
    );
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(90,60,10,0.75)";
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("S C R A T C H   H E R E", width / 2, height / 2 + 5);
    if (foil.current) foil.current.style.display = "none"; // the canvas now carries the gold

    let down = false;
    let strokes = 0;
    const scratch = (e: PointerEvent) => {
      if (!down) return;
      const r = c.getBoundingClientRect();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(e.clientX - r.left, e.clientY - r.top, 22, 0, Math.PI * 2);
      ctx.fill();
      // Check how much is cleared every few strokes, sampling a grid instead of every pixel.
      if (++strokes % 8) return;
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let clear = 0;
      let total = 0;
      for (let i = 3; i < data.length; i += 4 * 40) {
        total++;
        if (data[i] === 0) clear++;
      }
      if (clear / total > 0.5) setDone(true);
    };
    const start = (e: PointerEvent) => {
      down = true;
      c.setPointerCapture(e.pointerId);
      scratch(e);
    };
    const stop = () => (down = false);
    c.addEventListener("pointerdown", start);
    c.addEventListener("pointermove", scratch);
    c.addEventListener("pointerup", stop);
    c.addEventListener("pointercancel", stop);
    return () => {
      c.removeEventListener("pointerdown", start);
      c.removeEventListener("pointermove", scratch);
      c.removeEventListener("pointerup", stop);
      c.removeEventListener("pointercancel", stop);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--inv-gold)]/60 bg-white shadow-lg">
      <div className={`px-6 py-8 text-center ${done ? "revealed" : ""}`}>{children}</div>
      {!done && (
        <>
          <div ref={foil} data-cover aria-hidden className="foil absolute inset-0" />
          <canvas ref={canvas} data-cover aria-hidden className="absolute inset-0 size-full touch-none" style={{ cursor: "grab" }} />
          <button
            type="button"
            data-cover
            onClick={() => setDone(true)}
            className="absolute right-2 bottom-2 rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-[#6b4a12] backdrop-blur"
          >
            Reveal
          </button>
        </>
      )}
      <noscript>
        <style>{".foil{display:none}"}</style>
      </noscript>
    </div>
  );
}
