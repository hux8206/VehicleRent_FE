import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://6d8fc5baba3cbe6625ce828ce2a1e943@o4512402654101504.ingest.us.sentry.io/4512402676908032",
  tracesSampleRate: 1.0,
});

