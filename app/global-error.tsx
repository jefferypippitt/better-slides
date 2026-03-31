"use client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center">
          <h1 className="font-semibold text-2xl">Something went wrong</h1>
          <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            An unexpected application error occurred.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-500">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => reset()}
            type="button"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
