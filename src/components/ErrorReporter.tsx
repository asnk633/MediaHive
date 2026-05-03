"use client";

import { useEffect, useRef } from "react";

type ReporterProps = {
  /* ⎯⎯ props are only provided on the global-error page ⎯⎯ */
  error?: Error & { digest?: string };
  reset?: () => void;
};

export default function ErrorReporter({ error, reset }: ReporterProps) {
  /* ─ instrumentation shared by every route ─ */
  const lastOverlayMsg = useRef("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const inIframe = window.parent !== window;
    if (!inIframe) return;

    const send = (payload: unknown) => window.parent.postMessage(payload, "*");

    const onError = (e: ErrorEvent) =>
      send({
        type: "ERROR_CAPTURED",
        error: {
          message: e.message,
          stack: e.error?.stack,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          source: "window.onerror",
        },
        timestamp: Date.now(),
      });

    const onReject = (e: PromiseRejectionEvent) =>
      send({
        type: "ERROR_CAPTURED",
        error: {
          message: e.reason?.message ?? String(e.reason),
          stack: e.reason?.stack,
          source: "unhandledrejection",
        },
        timestamp: Date.now(),
      });

    // Capture hydration errors via a MutationObserver
    const captureHydrationError = () => {
      const errorMsg =
        document.querySelector(".error-reporter-overlay")?.textContent;
      if (errorMsg && errorMsg !== lastOverlayMsg.current) {
        lastOverlayMsg.current = errorMsg;
        send({
          type: "ERROR_CAPTURED",
          error: {
            message: errorMsg,
            stack: "Hydration error captured via MutationObserver.",
            source: "hydration_observer",
          },
          timestamp: Date.now(),
        });
      }
    };

    // Global listeners
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);

    // MutationObserver to catch hydration errors after render
    const observer = new MutationObserver(captureHydrationError);
    observer.observe(document.body, { subtree: true, childList: true });

    // Polling interval to check for messages if the observer misses something
    // Clear existing ref if present
    if (pollRef.current) {
        clearInterval(pollRef.current);
    }

    // Assign new interval to ref
    pollRef.current = setInterval(captureHydrationError, 1000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
      observer.disconnect();
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  /* ─ Render the error UI ─ */
  return (
    <html>
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try again fixing with Orchids
            </p>
          </div>
          <div className="space-y-2">
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {error?.message}
                  {error?.stack && (
                    <div className="mt-2 text-muted-foreground">
                      {error.stack}
                    </div>
                  )}
                  {error?.digest && (
                    <div className="mt-2 text-muted-foreground">
                      Digest: {error.digest}
                    </div>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
