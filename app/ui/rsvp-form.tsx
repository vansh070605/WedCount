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
};

const LABELS: Record<string, string> = { attending: "Coming", maybe: "Maybe", declined: "Can't come" };

export function RsvpForm({
  action,
  events,
  open,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  events: EventAnswer[];
  open: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [status, setStatus] = useState(() => Object.fromEntries(events.map((e) => [e.id, e.status])));

  return (
    <form
      // action: fallback if the guest submits before the page finishes loading (slow phones).
      // onSubmit: once loaded, skips React's automatic reset, which would wipe answers on a validation error.
      action={formAction}
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="flex flex-col gap-5"
    >
      {events.map((e) => {
        const going = status[e.id] === "attending" || status[e.id] === "maybe";
        return (
          <fieldset key={e.id} disabled={!open} className="reveal rounded-card border border-line bg-surface p-5 shadow-card transition-colors has-checked:border-gold/60 sm:p-6">
            <legend className="px-2 font-display text-xl font-semibold">{e.name}</legend>
            <p className="mb-4 text-sm text-muted">
              {e.when}
              {e.venue && ` · ${e.venue}`}
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
