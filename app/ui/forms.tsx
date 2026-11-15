"use client";

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/actions";
import { buttonClass, inputClass } from "@/app/ui/kit";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

export const input = inputClass;
const button = buttonClass("primary", "md");

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
      {label}
      {children}
    </label>
  );
}

// Edit forms submit without React's automatic form reset, which would flash the old values back in.
// Use together with action={formAction}: before the page finishes loading, that still saves via the server
// action; once loaded, this handler's preventDefault takes over.
const keepValues = (formAction: (fd: FormData) => void) => (ev: React.FormEvent<HTMLFormElement>) => {
  ev.preventDefault();
  const fd = new FormData(ev.currentTarget);
  startTransition(() => formAction(fd));
};

function Status({ state }: { state: FormState }) {
  return (
    <div aria-live="polite" className="text-sm">
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
      <button disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
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
        <button disabled={pending} className={`${button} mt-3 w-full sm:w-auto`}>
          {pending ? "Creating…" : "Create wedding"}
        </button>
      </div>
    </form>
  );
}

type GuestDefaults = { name: string; phone: string; side: string; relation: string };

// Adds a guest, or edits one when `guest` is given.
export function AddGuestForm({ action, guest }: { action: Action; guest?: GuestDefaults }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={guest ? keepValues(formAction) : undefined}
      className="grid gap-4 sm:grid-cols-2 sm:items-end"
    >
      <Field label="Name">
        <input name="name" required defaultValue={guest?.name} className={input} />
      </Field>
      <Field label="WhatsApp number">
        <input name="phone" type="tel" required placeholder="98765 43210" defaultValue={guest?.phone} className={input} />
      </Field>
      <Field label="Side">
        <select name="side" required defaultValue={guest?.side} className={input}>
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
        </select>
      </Field>
      <Field label="Relation">
        <select name="relation" defaultValue={guest?.relation} className={input}>
          <option value="family">Family</option>
          <option value="friend">Friend</option>
          <option value="colleague">Colleague</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Status state={state} />
        <button disabled={pending} className={`${button} mt-3 w-full sm:w-auto`}>
          {pending ? "Saving…" : guest ? "Save changes" : "Add guest"}
        </button>
      </div>
    </form>
  );
}

export function ImportGuestsForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
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

export function CopyLinkButton({ link, guestName }: { link: string; guestName: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy invite link for ${guestName}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked (permissions, plain http): let the planner copy it by hand.
          window.prompt(`Copy ${guestName}'s invite link:`, link);
        }
      }}
      className={buttonClass("secondary", "sm")}
    >
      <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}

type EventDefaults = { name: string; date: string; time: string; venue: string | null };

// Adds a function, or edits one when `event` is given (date as YYYY-MM-DD and time as HH:MM, both IST).
export function AddEventForm({ action, event }: { action: Action; event?: EventDefaults }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={event ? keepValues(formAction) : undefined}
      className="grid gap-3 sm:grid-cols-4 sm:items-end"
    >
      <Field label="Function">
        <input name="name" required placeholder="Sangeet" list="function-names" defaultValue={event?.name} className={input} />
        <datalist id="function-names">
          {["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"].map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Field>
      <Field label="Date">
        <input name="date" type="date" required defaultValue={event?.date} className={input} />
      </Field>
      <Field label="Time (IST)">
        <input name="time" type="time" required defaultValue={event?.time} className={input} />
      </Field>
      <Field label="Venue">
        <input name="venue" placeholder="Rambagh Lawns" defaultValue={event?.venue ?? undefined} className={input} />
      </Field>
      <div className="sm:col-span-4">
        <Status state={state} />
        <button disabled={pending} className={`${button} mt-3 w-full sm:w-auto`}>
          {pending ? "Saving…" : event ? "Save changes" : "Add function"}
        </button>
      </div>
    </form>
  );
}

// Opens WhatsApp in a new tab and records the send. The link opens even if recording fails.
export function WhatsAppSendButton({
  href,
  label,
  ariaLabel,
  onSend,
}: {
  href: string;
  label: string;
  ariaLabel: string;
  onSend: () => Promise<void>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={() => {
        onSend().catch(() => {});
      }}
      className={buttonClass("whatsapp", "sm")}
    >
      {label}
    </a>
  );
}

export function ActualCountForm({ action, current, eventName }: { action: Action; current: number | null; eventName: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        name="actual"
        type="number"
        min={0}
        max={99999}
        required
        inputMode="numeric"
        defaultValue={current ?? undefined}
        aria-label={`People who actually came to ${eventName}`}
        className={`${input} w-24`}
      />
      <button disabled={pending} className={buttonClass("secondary", "md")}>
        {pending ? "Saving…" : current == null ? "Save" : "Update"}
      </button>
      <Status state={state} />
    </form>
  );
}

// Server-side delete behind a browser confirm. The message should say what else goes with it.
export function DeleteButton({ action, confirmText, label }: { action: () => Promise<void>; confirmText: string; label: string }) {
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm(confirmText)) ev.preventDefault();
      }}
    >
      <button className={buttonClass("danger", "md")}>
        {label}
      </button>
    </form>
  );
}
