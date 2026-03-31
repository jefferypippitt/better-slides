"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PresentError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-8 text-white">
      <h2 className="font-semibold text-xl">Failed to load presentation</h2>
      <p className="text-sm text-white/60">
        We could not load this presentation. Please try again.
      </p>
      {error.digest ? (
        <p className="font-mono text-white/50 text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
