"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

export const input =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-2 focus:outline-rose-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const button =
  "rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      {children}
    </label>
  );
}

function Status({ state }: { state: FormState }) {
  return (
    <div aria-live="polite" className="text-sm">
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
  );
}

export function AuthForm({ action, mode }: { action: Action; mode: "login" | "signup" }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "signup" && (
        <Field label="Your name">
          <input name="name" required autoComplete="name" className={input} />
        </Field>
      )}
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" className={input} />
      </Field>
      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={input}
        />
      </Field>
      <Status state={state} />
      <button disabled={pending} className={button}>
        {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}

export function CreateWeddingForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <Field label="Wedding name">
        <input name="name" required placeholder="Priya & Rohit" className={input} />
      </Field>
      <Field label="City">
        <input name="city" placeholder="Jaipur" className={input} />
      </Field>
      <Field label="RSVP deadline">
        <input name="rsvpDeadline" type="date" className={input} />
      </Field>
      <div className="sm:col-span-3">
        <Status state={state} />
        <button disabled={pending} className={`${button} mt-2`}>
          {pending ? "Creating…" : "Create wedding"}
        </button>
      </div>
    </form>
  );
}

export function AddGuestForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <Field label="Name">
        <input name="name" required className={input} />
      </Field>
      <Field label="WhatsApp number">
        <input name="phone" type="tel" required placeholder="98765 43210" className={input} />
      </Field>
      <Field label="Side">
        <select name="side" required className={input}>
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
        </select>
      </Field>
      <Field label="Relation">
        <select name="relation" className={input}>
          <option value="family">Family</option>
          <option value="friend">Friend</option>
          <option value="colleague">Colleague</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <div className="sm:col-span-4">
        <Status state={state} />
        <button disabled={pending} className={`${button} mt-2`}>
          {pending ? "Adding…" : "Add guest"}
        </button>
      </div>
    </form>
  );
}

export function ImportGuestsForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="CSV file (columns: name, phone, side, relation)">
        <input name="file" type="file" accept=".csv,text/csv" required className={input} />
      </Field>
      <Status state={state} />
      <button disabled={pending} className={`${button} self-start`}>
        {pending ? "Importing…" : "Import guests"}
      </button>
    </form>
  );
}
