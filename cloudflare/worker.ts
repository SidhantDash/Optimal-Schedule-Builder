/**
 * Custom Cloudflare Worker entry; wrangler `main` points here. It composes
 * vinext's own App Router request handler with Sentry's `withSentry`.
 *
 * Server-side Sentry capture is wired HERE, via `@sentry/cloudflare`'s
 * `withSentry`, and deliberately NOT via `@sentry/nextjs`'s usual
 * `sentry.server.config.ts` / `instrumentation.ts` pattern: that pattern
 * assumes a Vercel/Node/Edge runtime and throws "Cannot call this
 * AsyncLocalStorage bound function outside of the request in which it was
 * created" (getsentry/sentry-javascript#18842) on Workers, and the same
 * constraint applies to vinext's own request-scoped `AsyncLocalStorage`.
 * `withSentry` instruments the `fetch` handler from OUTSIDE that request
 * context instead, capturing every unhandled error thrown inside a route, a
 * Server Component render or a Server Action. `SENTRY_DSN` reaches this Worker
 * as a plain variable; this file carries none.
 */
import * as Sentry from "@sentry/cloudflare";
import { buildSentryOptions } from "@devdogsuga/sdk/telemetry";
import handler from "vinext/server/app-router-entry";
import type { DeployEnvironment } from "~/env";

/**
 * The bindings this entry reads. `DEPLOY_ENV` is set by wrangler.jsonc's
 * per-env `vars` block. `SENTRY_RELEASE` and `SENTRY_DSN` are set per deploy
 * (`wrangler versions upload --var`); a Worker without them simply does not
 * start Sentry.
 *
 * `@sentry/cloudflare`'s `withSentry` infers ONE `Env` type parameter shared
 * by both the options callback and the `fetch` handler, so this type also has
 * to satisfy vinext's handler (pulled in structurally via `Parameters<...>`
 * rather than duplicated, so it can't drift).
 */
type WorkerEnv = NonNullable<Parameters<typeof handler.fetch>[1]> & {
  readonly DEPLOY_ENV: DeployEnvironment;
  readonly SENTRY_DSN?: string;
  readonly SENTRY_RELEASE?: string;
};

export default Sentry.withSentry(
  (env: WorkerEnv) => {
    const options = buildSentryOptions({
      // The Sentry project keeps the name DogDays was born with.
      service: "schedule-builder",
      environment: env.DEPLOY_ENV,
      dsn: env.SENTRY_DSN,
      release: env.SENTRY_RELEASE,
    });
    // `enableLogs` alone only ships `Sentry.logger` calls, and this code logs
    // through `console`. Forwarding warn/error makes the `console.error(e)`
    // in a route's catch-all visible in Sentry Logs instead of only in the
    // Worker's own log tail.
    return (
      options && {
        ...options,
        integrations: [
          Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
        ],
      }
    );
  },
  {
    fetch: (request, env, ctx) => handler.fetch(request, env, ctx),
  },
);
