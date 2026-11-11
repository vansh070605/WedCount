import Link from "next/link";
import { signup } from "@/app/actions";
import { AuthForm } from "@/app/ui/forms";

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">Create your planner account</h1>
      <AuthForm action={signup} mode="signup" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-rose-700 underline dark:text-rose-400">
          Log in
        </Link>
      </p>
    </main>
  );
}
