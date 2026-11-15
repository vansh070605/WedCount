import Link from "next/link";
import { login } from "@/app/actions";
import { AuthForm } from "@/app/ui/forms";
import { AuthShell } from "@/app/ui/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      sub="Log in to see your weddings and today's replies."
      footer={
        <>
          New planner?{" "}
          <Link href="/signup" className="draw font-medium text-brand">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm action={login} mode="login" />
    </AuthShell>
  );
}
