import type { Instrumentation } from "next";

// One structured line per server error, readable in Vercel's runtime logs.
// Logs the route pattern (e.g. /r/[token]), never the real path or headers: guest links and session cookies are secrets.
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: err instanceof Error ? err.message : String(err),
      digest: typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined,
      method: request.method,
      route: context.routePath,
      type: context.routeType,
    }),
  );
};
