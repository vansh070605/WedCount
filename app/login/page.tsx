import Link from "next/link";
import { login } from "@/app/actions";
import { AuthForm } from "@/app/ui/forms";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Log in to WedCount</h1>
      <AuthForm action={login} mode="login" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        New planner?{" "}
        <Link href="/signup" className="font-medium text-rose-700 underline dark:text-rose-400">
          Create an account
        </Link>
      </p>
    </main>
  );
}
