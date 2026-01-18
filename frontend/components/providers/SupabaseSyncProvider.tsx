"use client";

/**
 * SupabaseSyncProvider
 *
 * Wraps the useSupabaseSync hook to provide cross-device sync functionality.
 * This component renders no UI - it only sets up the sync listeners.
 *
 * Add this provider inside QueryProvider in the root layout.
 */

import { type ReactNode } from "react";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

interface SupabaseSyncProviderProps {
  children: ReactNode;
}

export function SupabaseSyncProvider({ children }: SupabaseSyncProviderProps) {
  useSupabaseSync();
  return <>{children}</>;
}
