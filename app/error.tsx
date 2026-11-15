"use client";

import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="text-muted">
        Nothing you entered was lost unless you saw a &ldquo;Saved&rdquo; message just before this. Please try again.
      </p>
      <button
        onClick={() => retry()}
        className="press self-start rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-strong"
      >
        Try again
      </button>
    </main>
  );
}
