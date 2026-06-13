"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-20 text-center">
      <p className="text-muted-foreground text-6xl font-bold">500</p>
      <p className="text-foreground mt-4 text-lg">
        Something went wrong.
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="bg-foreground text-background hover:bg-foreground/90 mt-8 inline-flex h-8 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
