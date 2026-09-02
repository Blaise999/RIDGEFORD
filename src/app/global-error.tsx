"use client";

/**
 * Last-resort error boundary. This catches errors that even the root
 * `error.tsx` can't (e.g. errors in the root layout itself). It MUST
 * render its own <html> and <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#fff",
          color: "#0a0c10",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            We hit a snag loading Ridgeford Capital Bank
          </h1>
          <p style={{ fontSize: 14, color: "#5a6775", margin: "0 0 20px" }}>
            Please refresh the page. If the problem continues, contact
            support@ridgefordbank.eu.
          </p>
          {error?.digest && (
            <p
              style={{
                fontSize: 11,
                color: "#8491a0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                margin: "0 0 16px",
              }}
            >
              Ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            type="button"
            style={{
              background: "#2f66ff",
              color: "#fff",
              border: 0,
              padding: "12px 22px",
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 8px 24px -8px rgba(47,102,255,0.55)",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
