"use client";

import { cn } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface BalanceDisplayProps {
  amount: number;
  className?: string;
  canEdit?: boolean;
  onEdit?: () => void;
}

export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format number with K/M suffixes for compact display
function formatCompact(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

export function BalanceDisplay({ amount, className, canEdit, onEdit }: BalanceDisplayProps) {
  const isPositive = amount >= 0;
  const isHealthy = amount >= 2000000; // 2M VND threshold for "healthy"

  const handleDoubleClick = () => {
    if (canEdit && onEdit) {
      onEdit();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Premium card container */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 sm:p-8",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          "border border-white/10",
          "shadow-2xl shadow-black/20",
          canEdit && "cursor-pointer group"
        )}
        onDoubleClick={handleDoubleClick}
        title={canEdit ? "Double-tap to edit" : undefined}
      >
        {/* Animated gradient orbs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Top row - Icon and status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br shadow-lg",
                isPositive
                  ? "from-emerald-500 to-emerald-600 shadow-emerald-500/30"
                  : "from-red-500 to-red-600 shadow-red-500/30"
              )}>
                <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                  Running Tab
                </p>
                <p className="text-sm font-semibold text-white/80">
                  Available Balance
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
              isHealthy
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-amber-500/20 text-amber-400"
            )}>
              {isHealthy ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Healthy</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Low</span>
                </>
              )}
            </div>
          </div>

          {/* Balance amount - Hero text */}
          <div className="relative py-4">
            {/* Glow effect behind the number */}
            <div
              className={cn(
                "absolute inset-0 blur-3xl opacity-40 -z-10",
                isPositive ? "bg-emerald-500" : "bg-red-500"
              )}
            />

            <p
              className={cn(
                "relative text-4xl sm:text-5xl md:text-6xl font-black tracking-tight select-none tabular-nums",
                "transition-all duration-300",
                isPositive ? "text-emerald-400" : "text-red-400",
                canEdit && "group-hover:scale-[1.02] group-active:scale-[0.98]"
              )}
            >
              {formatVND(amount)}

              {/* Gradient overlay: base text remains visible if clipping fails on Safari */}
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0",
                  isPositive
                    ? "text-transparent bg-clip-text [-webkit-background-clip:text] bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400"
                    : "text-transparent bg-clip-text [-webkit-background-clip:text] bg-gradient-to-r from-red-300 via-red-400 to-rose-400"
                )}
                style={{ WebkitTextFillColor: "transparent" }}
              >
                {formatVND(amount)}
              </span>
            </p>

            {/* Sparkle decoration */}
            <Sparkles className={cn(
              "absolute -top-1 -right-2 w-5 h-5 opacity-60",
              isPositive ? "text-emerald-400" : "text-red-400"
            )} />
          </div>

          {/* Bottom row - Compact value and edit hint */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <span className="font-mono">{formatCompact(amount)} VND</span>
            </div>

            {canEdit && (
              <p className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-white/50 transition-colors">
                <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                Double-tap to adjust
              </p>
            )}
          </div>
        </div>

        {/* Hover shine effect */}
        {canEdit && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        )}
      </div>
    </div>
  );
}
