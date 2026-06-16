"use client";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center font-sans antialiased">
        <div className="px-4 text-center">
          <p className="text-muted-foreground text-6xl font-bold">500</p>
          <p className="text-foreground mt-4 text-lg">Critical error</p>
          <p className="text-muted-foreground mt-1 text-sm">
            A critical error occurred. Please refresh the page.
          </p>
          <button
            onClick={reset}
            className="bg-foreground text-background hover:bg-foreground/90 mt-8 inline-flex h-8 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors"
          >
            Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
