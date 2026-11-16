import { Suspense } from "react";
import { getPlanner } from "@/lib/auth";
import { ButtonLink } from "@/app/ui/kit";

function LoggedOut() {
  return (
    <>
      <ButtonLink href="/login" variant="ghost" size="sm">
        Log in
      </ButtonLink>
      <ButtonLink href="/signup" size="sm">
        Get started
      </ButtonLink>
    </>
  );
}

async function Who() {
  const planner = await getPlanner();
  if (!planner) return <LoggedOut />;
  return (
    <ButtonLink href="/home" size="sm">
      Open WedCount
    </ButtonLink>
  );
}

// Header buttons on public pages: a logged-in planner goes straight back to their home.
// The page stays static; only this reads the session cookie, streamed in after the shell.
export function HeaderAuth() {
  return (
    <Suspense fallback={<LoggedOut />}>
      <Who />
    </Suspense>
  );
}
