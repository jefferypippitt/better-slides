"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h2 className="font-semibold text-xl">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">
        We could not complete that request. Please try again.
      </p>
      {error.digest ? (
        <p className="font-mono text-muted-foreground text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
