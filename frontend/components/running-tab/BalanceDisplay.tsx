"use client";

import { cn } from "@/lib/utils";

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

export function BalanceDisplay({ amount, className, canEdit, onEdit }: BalanceDisplayProps) {
  const handleDoubleClick = () => {
    if (canEdit && onEdit) {
      onEdit();
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl p-6 bg-gradient-to-br from-slate-800 to-slate-950 border border-white/[0.09]",
        canEdit && "cursor-pointer active:scale-[0.99] transition-transform",
        className,
      )}
      onDoubleClick={handleDoubleClick}
      title={canEdit ? "Double-tap to adjust" : undefined}
    >
      <p
        className="py-2 font-mono text-[42px] font-extrabold select-none tabular-nums text-transparent bg-clip-text [-webkit-background-clip:text] bg-gradient-to-b from-emerald-300 via-emerald-400 to-emerald-500"
        style={{ WebkitTextFillColor: "transparent" }}
      >
        {formatVND(amount)}
      </p>
    </div>
  );
}
