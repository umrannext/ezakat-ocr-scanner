import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7ac9ad2d3ea9e90feec19d53e17a18af@o4512170373480448.ingest.de.sentry.io/4512170383376464",
      tracesSampleRate: 1,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://7ac9ad2d3ea9e90feec19d53e17a18af@o4512170373480448.ingest.de.sentry.io/4512170383376464",
      tracesSampleRate: 1,
    });
  }
}

