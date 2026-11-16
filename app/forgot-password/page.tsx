import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions";
import { AuthShell } from "@/app/ui/auth-shell";
import { ForgotPasswordForm } from "@/app/ui/forms";

export const metadata: Metadata = { title: "Reset your password · WedCount" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      sub="Enter the email you signed up with and we'll send a link to choose a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="draw font-medium text-brand">
            Log in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm action={requestPasswordReset} />
    </AuthShell>
  );
}
