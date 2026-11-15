"use client";

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/actions";
import { input } from "@/app/ui/forms";

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
          <fieldset key={e.id} disabled={!open} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <legend className="px-1 font-semibold">{e.name}</legend>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              {e.when}
              {e.venue && ` · ${e.venue}`}
            </p>

            <div role="radiogroup" aria-label={`Are you coming to ${e.name}?`} className="flex flex-wrap gap-2">
              {Object.entries(LABELS).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm has-checked:border-rose-700 has-checked:bg-rose-50 dark:border-zinc-700 dark:has-checked:bg-rose-950"
                >
                  <input
                    type="radio"
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
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Veg
                  <input name={`veg_${e.id}`} type="number" min={0} max={20} inputMode="numeric" defaultValue={e.veg} className={input} />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Non-veg
                  <input name={`nonveg_${e.id}`} type="number" min={0} max={20} inputMode="numeric" defaultValue={e.nonVeg} className={input} />
                </label>
                <label className="col-span-2 flex flex-col gap-1 text-sm font-medium sm:col-span-1">
                  Arriving around
                  <input name={`arrival_${e.id}`} type="time" defaultValue={e.arrival} className={input} />
                </label>
              </div>
            )}
          </fieldset>
        );
      })}

      <div aria-live="polite" className="text-sm">
        {!open && <p className="text-zinc-600 dark:text-zinc-400">Replies are closed. Contact the family to change your plans.</p>}
        {state.error && <p className="text-red-700 dark:text-red-400">{state.error}</p>}
        {state.errors && (
          <ul className="mt-1 list-disc pl-5 text-red-700 dark:text-red-400">
            {state.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {state.message && <p className="text-green-700 dark:text-green-400">{state.message}</p>}
      </div>

      {open && (
        <button
          disabled={pending}
          className="rounded-md bg-rose-700 px-4 py-3 text-base font-medium text-white hover:bg-rose-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save my reply"}
        </button>
      )}
    </form>
  );
}
