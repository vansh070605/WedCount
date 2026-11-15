"use client";

import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Nothing you entered was lost unless you saw a &ldquo;Saved&rdquo; message just before this. Please try again.
      </p>
      <button
        onClick={() => retry()}
        className="self-start rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
      >
        Try again
      </button>
    </main>
  );
}
