import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { hashToken, isUsable } from "@/lib/reset";
import { resetPassword } from "@/app/actions";
import { AuthShell } from "@/app/ui/auth-shell";
import { NewPasswordForm } from "@/app/ui/forms";

// The token is in the URL: never send it to other sites as a referrer.
export const metadata: Metadata = { title: "Choose a new password · WedCount", referrer: "no-referrer" };

export default function ResetPasswordPage(props: PageProps<"/reset-password/[token]">) {
  return (
    <AuthShell
      title="Choose a new password"
      sub="At least 8 characters. You'll be signed out on every other device."
      footer={
        <Link href="/login" className="draw font-medium text-brand">
          Back to log in
        </Link>
      }
    >
      <Suspense fallback={<p className="text-sm text-muted">Checking your link…</p>}>
        <Reset params={props.params} />
      </Suspense>
    </AuthShell>
  );
}

async function Reset({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reset = await prisma.passwordReset.findUnique({ where: { id: hashToken(token) } });
  if (!isUsable(reset))
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-danger">This link has expired or was already used.</p>
        <Link href="/forgot-password" className="draw self-start font-medium text-brand">
          Send me a new link
        </Link>
      </div>
    );
  return <NewPasswordForm action={resetPassword.bind(null, token)} />;
}
