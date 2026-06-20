"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RunningTabError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[RunningTab] Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="h-7 w-7 text-amber-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          The running tab encountered an error. Your data is safe — try refreshing.
        </p>
      </div>
      <Button variant="outline" onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
