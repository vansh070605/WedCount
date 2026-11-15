import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="text-muted">
        If you opened a wedding invite, the link may be incomplete. Ask the family to send it again.
      </p>
      <Link href="/" className="draw self-start text-sm font-medium text-brand">
        Go to WedCount
      </Link>
    </main>
  );
}
