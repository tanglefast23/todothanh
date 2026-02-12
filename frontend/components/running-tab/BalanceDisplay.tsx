"use client";

import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  amount: number;
  className?: string;
  canEdit?: boolean;
  onEdit?: () => void;
  children?: React.ReactNode;
}

export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function BalanceDisplay({ amount, className, canEdit, onEdit, children }: BalanceDisplayProps) {
  const handleDoubleClick = () => {
    if (canEdit && onEdit) {
      onEdit();
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl py-7 px-6 flex flex-col gap-2",
        canEdit && "cursor-pointer active:scale-[0.99] transition-transform",
        className,
      )}
      style={{ background: "linear-gradient(to bottom right, #FF6B6B, #FF8E53, #FEB47B)" }}
      onDoubleClick={handleDoubleClick}
      title={canEdit ? "Double-tap to adjust" : undefined}
    >
      <p className="text-sm font-medium text-white/80 select-none">
        Current Balance
      </p>
      <p className="text-[42px] font-extrabold leading-none select-none tabular-nums text-white tracking-tight">
        {formatNumber(amount)}
      </p>
      <p className="text-sm font-semibold text-white/60 select-none">
        VND
      </p>

      {children && (
        <div className="flex items-center gap-3 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
