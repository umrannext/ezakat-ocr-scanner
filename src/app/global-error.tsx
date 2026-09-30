"use client";

import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h2>Ralat Sistem Kritikal</h2>
          <p style={{ color: 'red' }}>{(error as any).message || "Unknown error"}</p>
        </div>
      </body>
    </html>
  );
}

