import Link from "next/link";
import { signup } from "@/app/actions";
import { AuthForm } from "@/app/ui/forms";
import { AuthShell } from "@/app/ui/auth-shell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Start planning"
      sub="Create your planner account. Add your first wedding in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="draw font-medium text-brand">
            Log in
          </Link>
        </>
      }
    >
      <AuthForm action={signup} mode="signup" />
    </AuthShell>
  );
}
