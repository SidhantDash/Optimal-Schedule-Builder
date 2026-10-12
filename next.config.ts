import type { NextConfig } from "next";
import { buildSecurityHeaders } from "@devdogsuga/sdk/headers";
import { dogDaysCsp } from "~/config/csp";
import { env } from "~/env";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          environment: env.DEPLOY_ENV,
          csp: dogDaysCsp({
            environment: env.DEPLOY_ENV,
            supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
            catalogUrl: env.NEXT_PUBLIC_CATALOG_URL,
            // No nonce: this static `headers()` declaration is evaluated once
            // at build/dev-server start, not per request, so it can never
            // mint one -- and never needs to: it is a fallback purely for
            // routes middleware's matcher excludes (static assets, images),
            // none of which carry an inline script to gate.
            sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
          }),
        }),
      },
    ];
  },
};

export default nextConfig;
