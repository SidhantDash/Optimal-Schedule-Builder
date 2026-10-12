/**
 * Browser-side Sentry init. Next.js loads this automatically -- no explicit
 * import anywhere -- because of its name and location (same level as
 * `middleware.ts`); see
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client.
 *
 * Deliberately the ONLY client-side Sentry surface. Server capture is wired in
 * `cloudflare/worker.ts` via `@sentry/cloudflare`'s `withSentry` instead,
 * because it must wrap vinext's request context from the outside (see there).
 *
 * Error capture plus the User Feedback widget, and nothing else. No browser
 * tracing (`tracesSampleRate: 0`) and no Session Replay (no
 * `replayIntegration()`, both replay sample rates zeroed): a report is what the
 * member typed and, if they choose, a screenshot. `browserNoiseFilter` drops
 * the known extension/ad-blocker noise `@devdogsuga/sdk/telemetry` documents.
 */
import * as Sentry from "@sentry/nextjs";
import {
  browserNoiseFilter,
  buildSentryOptions,
} from "@devdogsuga/sdk/telemetry";
import { env } from "~/env";

const options = buildSentryOptions({
  service: "schedule-builder",
  environment: env.NEXT_PUBLIC_DEPLOY_ENV,
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  // See `apps/platform/src/instrumentation-client.ts` for why this reads
  // `process.env` directly rather than `env.*` from `~/env`.
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  extraBeforeSend: [browserNoiseFilter],
});

// No DSN (the normal state before the org is onboarded, and every local dev
// run) means no `Sentry.init()` call at all -- no network, no console noise.
if (options) {
  Sentry.init({
    ...options,
    tracesSampleRate: 0,
    integrations: [
      // The "Feedback" button every page shows, bottom right. Reports land in
      // Sentry's User Feedback for the DogDays project, tied to the issue
      // that was open when the member sent them. Neither a name nor an
      // email is required: a visitor who is not signed in can still say
      // what is wrong.
      Sentry.feedbackIntegration({
        colorScheme: "system",
        showBranding: false,
        isNameRequired: false,
        isEmailRequired: false,
        triggerLabel: "Feedback",
        triggerAriaLabel: "Send feedback about DogDays",
        submitButtonLabel: "Send feedback",
        formTitle: "Send feedback",
        messagePlaceholder:
          "What happened, or what would make DogDays better? If something broke, what did you expect to see?",
        successMessageText: "Thanks, that helps the DogDays team.",
        enableScreenshot: true,
      }),
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
