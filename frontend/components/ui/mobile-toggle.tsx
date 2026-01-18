"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";
import { playClickSound } from "@/lib/audio";

interface MobileToggleProps {
  className?: string;
  size?: "sm" | "md";
}

/** Toggle between mobile and desktop view modes - stays on current page */
export const MobileToggle = memo(function MobileToggle({
  className,
  size = "md",
}: MobileToggleProps) {
  // Prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const mobileMode = useSettingsStore((state) => state.mobileMode);
  const setMobileMode = useSettingsStore((state) => state.setMobileMode);

  const handleToggle = useCallback(() => {
    playClickSound();
    // Simply toggle between mobile and desktop - no navigation
    setMobileMode(mobileMode === "mobile" ? "desktop" : "mobile");
  }, [mobileMode, setMobileMode]);

  // Use default "desktop" on server, actual value after mount
  const displayMode = isMounted ? mobileMode : "desktop";
  const isMobile = displayMode === "mobile";

  return (
    <button
      onClick={handleToggle}
      disabled={!isMounted}
      className={cn(
        "relative flex items-center justify-center rounded-md border border-border/50 transition-all hover:bg-muted",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        !isMounted && "opacity-50",
        className
      )}
      title={isMobile ? "Switch to desktop view" : "Switch to mobile view"}
      aria-label={`View mode: ${isMobile ? "mobile" : "desktop"}. Click to switch.`}
    >
      {isMobile ? (
        <Smartphone className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      ) : (
        <Monitor className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      )}
    </button>
  );
});
