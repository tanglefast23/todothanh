"use client";

import {
  ShoppingCart,
  Fuel,
  Coffee,
  UtensilsCrossed,
  Car,
  Stethoscope,
  Scissors,
  CupSoda,
  CircleParking,
  Wine,
  Martini,
  Check,
  X,
  Receipt,
} from "lucide-react";
import type { ComponentType } from "react";
import type { ExpenseWithOwner } from "@/types/runningTab";
import { cn } from "@/lib/utils";
import { formatVND } from "./BalanceDisplay";
import { formatRelativeTime } from "@/lib/formatters";
import { AttachmentUpload } from "./AttachmentUpload";

// --- Icon mapping (Pencil design uses Lucide icons in colored containers) ---

interface ExpenseLucideIcon {
  Icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

function getExpenseLucideIcon(name: string): ExpenseLucideIcon {
  const n = name.toLowerCase();

  if (n.includes("groceries") || n.includes("grocery")) {
    return { Icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/10" };
  }
  if (n.includes("gas") || n.includes("fuel") || n.includes("petrol")) {
    return { Icon: Fuel, color: "text-orange-400", bg: "bg-orange-500/10" };
  }
  if (n.includes("coffee") || n.includes("café") || n.includes("cafe")) {
    return { Icon: Coffee, color: "text-cyan-400", bg: "bg-cyan-500/10" };
  }
  if (n.includes("bubble tea") || n.includes("boba")) {
    return { Icon: CupSoda, color: "text-purple-400", bg: "bg-purple-500/10" };
  }
  if (n.includes("food") || n.includes("lunch") || n.includes("dinner") || n.includes("breakfast")) {
    return { Icon: UtensilsCrossed, color: "text-amber-400", bg: "bg-amber-500/10" };
  }
  if (n.includes("parking") || n.includes("park")) {
    return { Icon: CircleParking, color: "text-blue-400", bg: "bg-blue-500/10" };
  }
  if (n.includes("kia") || n.includes("car")) {
    return { Icon: Car, color: "text-slate-300", bg: "bg-slate-500/10" };
  }
  if (n.includes("vet")) {
    return { Icon: Stethoscope, color: "text-pink-400", bg: "bg-pink-500/10" };
  }
  if (n.includes("grooming") || n.includes("groom")) {
    return { Icon: Scissors, color: "text-violet-400", bg: "bg-violet-500/10" };
  }
  if (n.includes("many drinks")) {
    return { Icon: Martini, color: "text-rose-400", bg: "bg-rose-500/10" };
  }
  if (n.includes("drinks") || n.includes("cocktail") || n.includes("alcohol")) {
    return { Icon: Wine, color: "text-rose-400", bg: "bg-rose-500/10" };
  }

  // Default fallback
  return { Icon: Receipt, color: "text-zinc-400", bg: "bg-zinc-500/10" };
}

// --- Types ---

interface PendingApprovalProps {
  expenses: ExpenseWithOwner[];
  canApprove: boolean;
  onApprove: (id: string) => void;
  onApproveAll?: () => void;
  onReject: (id: string) => void;
  onAttachment: (id: string, url: string) => void;
}

// --- Component ---

export function PendingApproval({
  expenses,
  canApprove,
  onApprove,
  onApproveAll,
  onReject,
  onAttachment,
}: PendingApprovalProps) {
  if (expenses.length === 0) return null;

  return (
    <section className="flex flex-col gap-3.5 rounded-2xl bg-[#0c0c0f] p-5 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white text-balance">Pending Approval</h3>
          <span className="flex items-center justify-center rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-orange-500">
            {expenses.length}
          </span>
        </div>
        {canApprove && onApproveAll && expenses.length > 1 && (
          <button
            onClick={onApproveAll}
            className="text-xs font-medium text-orange-500 active:scale-95 transition-transform"
          >
            Approve all
          </button>
        )}
      </div>

      {/* Expense Cards */}
      <div className="flex flex-col gap-2.5">
        {expenses.map((expense) => (
          <PendingExpenseCard
            key={expense.id}
            expense={expense}
            canApprove={canApprove}
            onApprove={onApprove}
            onReject={onReject}
            onAttachment={onAttachment}
          />
        ))}
      </div>
    </section>
  );
}

// --- Individual Card ---

interface PendingExpenseCardProps {
  expense: ExpenseWithOwner;
  canApprove: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAttachment: (id: string, url: string) => void;
}

function PendingExpenseCard({
  expense,
  canApprove,
  onApprove,
  onReject,
  onAttachment,
}: PendingExpenseCardProps) {
  const { Icon, color, bg } = getExpenseLucideIcon(expense.name);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#1f1f23] bg-[#141417]">
      {/* Content Row */}
      <div className="flex items-center gap-3.5 p-4">
        {/* Icon */}
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", bg)}>
          <Icon className={cn("size-5", color)} />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Name + Amount */}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white">
              {expense.name}
            </span>
            <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-white">
              {formatVND(expense.amount)}
            </span>
          </div>

          {/* Meta: person + time */}
          <div className="flex items-center gap-1.5">
            {expense.creatorName && (
              <span className="text-[11px] font-medium text-zinc-500">
                {expense.creatorName}
              </span>
            )}
            {expense.creatorName && (
              <span className="size-[3px] rounded-full bg-zinc-600" />
            )}
            <span className="text-[11px] text-zinc-600">
              {formatRelativeTime(expense.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Attachment upload (if no attachment yet) */}
      {!expense.attachmentUrl && (
        <div className="px-4 pb-1">
          <AttachmentUpload
            expenseId={expense.id}
            onUpload={(url) => onAttachment(expense.id, url)}
          />
        </div>
      )}

      {/* Action Buttons */}
      {canApprove && (
        <div className="flex gap-2 px-4 pb-3 pt-1">
          <button
            onClick={() => onReject(expense.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-red-500/20 bg-red-500/8 py-2 text-xs font-medium text-red-500 transition-transform active:scale-[0.97]"
          >
            <X className="size-3.5" />
            Reject
          </button>
          <button
            onClick={() => onApprove(expense.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 py-2 text-xs font-medium text-emerald-500 transition-transform active:scale-[0.97]"
          >
            <Check className="size-3.5" />
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
