"use client";

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/actions";
import { input } from "@/app/ui/forms";
import { buttonClass } from "@/app/ui/kit";

export type EventAnswer = {
  id: string;
  name: string;
  when: string;
  venue: string | null;
  status: string;
  veg: number;
  nonVeg: number;
  arrival: string;
  names: string[];
  open: boolean; // replies still accepted for this function
};

const LABELS: Record<string, string> = { attending: "Coming", maybe: "Maybe", declined: "Can't come" };

export function RsvpForm({
  action,
  events,
  guestName,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  events: EventAnswer[];
  guestName: string;
}) {
  const open = events.some((e) => e.open);
  const [state, formAction, pending] = useActionState(action, {});
  const [status, setStatus] = useState(() => Object.fromEntries(events.map((e) => [e.id, e.status])));
  // People per function as sent, for the thank-you card. Before JS loads the saved counts come back as props.
  const [people, setPeople] = useState<Record<string, number>>({});
  // The thank-you card shows for each successful save until the guest closes it.
  const [closed, setClosed] = useState<FormState | null>(null);
  const showThanks = !!state.message && closed !== state;

  return (
    <form
      // action: fallback if the guest submits before the page finishes loading (slow phones).
      // onSubmit: once loaded, skips React's automatic reset, which would wipe answers on a validation error.
      action={formAction}
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        setPeople(Object.fromEntries(events.map((e) => [e.id, Number(fd.get(`veg_${e.id}`) || 0) + Number(fd.get(`nonveg_${e.id}`) || 0)])));
        startTransition(() => formAction(fd));
      }}
      className="flex flex-col gap-5"
    >
      {events.map((e) => {
        const going = status[e.id] === "attending" || status[e.id] === "maybe";
        return (
          <fieldset key={e.id} disabled={!e.open} className="reveal rounded-card border border-line bg-surface p-5 shadow-card transition-colors has-checked:border-brand/40 sm:p-6">
            <legend className="px-2 font-display text-xl font-semibold">{e.name}</legend>
            <p className="mb-4 text-sm text-muted">
              {e.when}
              {e.venue && ` · ${e.venue}`}
              {!e.open && " · Replies closed"}
            </p>

            <div role="radiogroup" aria-label={`Are you coming to ${e.name}?`} className="flex flex-wrap gap-2">
              {Object.entries(LABELS).map(([value, label]) => (
                <label
                  key={value}
                  className="press flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium whitespace-nowrap select-none sm:px-4 hover:border-brand has-checked:border-brand has-checked:bg-brand has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-brand sm:flex-none"
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name={`status_${e.id}`}
                    value={value}
                    required
                    defaultChecked={e.status === value}
                    onChange={() => setStatus((s) => ({ ...s, [e.id]: value }))}
                  />
                  {label}
                </label>
              ))}
            </div>

            {going && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Veg
                  <input name={`veg_${e.id}`} type="number" min={0} max={20} inputMode="numeric" defaultValue={e.veg} className={input} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Non-veg
                  <input name={`nonveg_${e.id}`} type="number" min={0} max={20} inputMode="numeric" defaultValue={e.nonVeg} className={input} />
                </label>
                <label className="col-span-2 flex flex-col gap-1.5 text-sm font-medium sm:col-span-1">
                  Arriving around
                  <input name={`arrival_${e.id}`} type="time" defaultValue={e.arrival} className={input} />
                </label>
                <label className="col-span-2 flex flex-col gap-1.5 text-sm font-medium sm:col-span-3">
                  Names of everyone coming, one per line
                  <textarea
                    name={`names_${e.id}`}
                    rows={3}
                    defaultValue={(e.names.length ? e.names : [guestName]).join("\n")}
                    className={input}
                  />
                </label>
              </div>
            )}
          </fieldset>
        );
      })}

      <div aria-live="polite" className="text-sm">
        {!open && <p className="text-muted">Replies are closed. Contact the family to change your plans.</p>}
        {state.error && <p className="text-danger">{state.error}</p>}
        {state.errors && (
          <ul className="mt-1 list-disc pl-5 text-danger">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {state.message && <p className="text-ok">{state.message}</p>}
      </div>

      {showThanks && (
        <Thanks
          guestName={guestName}
          answers={events
            .filter((e) => status[e.id])
            .map((e) => ({ name: e.name, status: status[e.id], people: people[e.id] ?? e.veg + e.nonVeg }))}
          onClose={() => setClosed(state)}
        />
      )}

      {open && (
        <button
          disabled={pending}
          className={buttonClass("primary", "lg", "w-full")}
        >
          {pending ? "Saving…" : "Save my reply"}
        </button>
      )}
    </form>
  );
}

// After a save: a celebratory card with what was sent. Petals fall once; under reduced motion it simply appears.
const PETALS = [8, 18, 29, 41, 52, 63, 74, 86, 94, 35, 69, 13];
function Thanks({
  guestName,
  answers,
  onClose,
}: {
  guestName: string;
  answers: { name: string; status: string; people: number }[];
  onClose: () => void;
}) {
  const coming = answers.some((a) => a.status === "attending");
  const maybe = answers.some((a) => a.status === "maybe");
  const line = coming
    ? "We can't wait to celebrate with you."
    : maybe
      ? "We hope you can make it. Update your reply once you know."
      : "We'll miss you. Thank you for letting us know.";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="thanks-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="thanks fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/45 p-5 backdrop-blur-sm"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PETALS.map((left, i) => (
          <svg
            key={i}
            viewBox="0 0 10 16"
            className="petal absolute -top-6"
            style={{ left: `${left}%`, width: 9 + (i % 4) * 2, "--d": `${(i * 170) % 900}ms`, "--dx": `${i % 2 ? -30 : 30}px`, "--spin": `${i % 2 ? -1 : 1}turn` } as React.CSSProperties}
          >
            <ellipse cx="5" cy="8" rx="4.2" ry="7.5" fill={i % 3 ? "#f6b52a" : "#ef8f12"} />
          </svg>
        ))}
      </div>
      <div className="thanks-card relative w-full max-w-sm rounded-3xl border border-[var(--inv-gold)]/60 bg-[var(--color-paper,#fffdf8)] px-6 pt-9 pb-6 text-center shadow-2xl">
        <svg viewBox="0 0 64 64" aria-hidden className="mx-auto size-20 text-[var(--inv-gold)]">
          <circle className="thanks-ring" cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3" pathLength={1} />
          <path className="thanks-tick" d="M20 33 28.5 41 45 24" fill="none" stroke="var(--inv-deep)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        </svg>
        <h2 id="thanks-title" className="thanks-in mt-4 font-[family-name:var(--font-script)] text-5xl text-[var(--inv-deep)]">
          Thank you!
        </h2>
        <p className="thanks-in mt-2 text-sm text-muted" style={{ "--d": "120ms" } as React.CSSProperties}>
          {guestName}, your reply is with the family. {line}
        </p>
        <ul className="thanks-in mt-5 divide-y divide-line rounded-2xl border border-line text-left text-sm" style={{ "--d": "240ms" } as React.CSSProperties}>
          {answers.map((a) => (
            <li key={a.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="font-medium">{a.name}</span>
              <span className={a.status === "attending" ? "font-semibold text-[var(--inv-deep)]" : "text-muted"}>
                {LABELS[a.status]}
                {a.status !== "declined" && a.people > 0 && ` · ${a.people} ${a.people === 1 ? "person" : "people"}`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">You can change your reply from this page until replies close.</p>
        <button type="button" autoFocus onClick={onClose} className={buttonClass("primary", "lg", "mt-5 w-full")}>
          Done
        </button>
      </div>
    </div>
  );
}
