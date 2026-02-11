"use client";

import {
  Check,
  X,
  ImagePlus,
  CircleCheck,
  CircleX,
} from "lucide-react";
import type { ExpenseWithOwner } from "@/types/runningTab";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";
import { getExpenseIcon } from "@/lib/expenseIcons";
import { AttachmentUpload } from "./AttachmentUpload";

// --- Types ---

interface PendingApprovalProps {
  expenses: ExpenseWithOwner[];
  canApprove: boolean;
  onApprove: (id: string) => void;
  onApproveAll?: () => void;
  onReject: (id: string) => void;
  onRejectAll?: () => void;
  onAttachment: (id: string, url: string) => void;
}

// --- Component ---

export function PendingApproval({
  expenses,
  canApprove,
  onApprove,
  onApproveAll,
  onReject,
  onRejectAll,
  onAttachment,
}: PendingApprovalProps) {
  if (expenses.length === 0) return null;

  return (
    <section className="flex flex-col gap-3.5">
      {/* Header with amber badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold tracking-tight text-foreground">Pending Approval</h3>
          <span className="flex items-center gap-1 rounded-xl bg-[#FFFBEB] px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-amber-600">
              {expenses.length} {expenses.length === 1 ? "item" : "items"}
            </span>
          </span>
        </div>
      </div>

      {/* Expense Cards */}
      <div className="flex flex-col gap-3.5">
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

      {/* Approve All / Reject All buttons */}
      {canApprove && expenses.length > 1 && (
        <div className="flex gap-2.5">
          {onApproveAll && (
            <button
              onClick={onApproveAll}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-emerald-500 h-11 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
            >
              <CircleCheck className="size-[18px]" />
              Approve All
            </button>
          )}
          {onRejectAll && (
            <button
              onClick={onRejectAll}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-white border-[1.5px] border-red-300 h-11 text-sm font-semibold text-red-500 transition-transform active:scale-[0.97]"
            >
              <CircleX className="size-[18px]" />
              Reject All
            </button>
          )}
        </div>
      )}
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
  const { Icon, color, bg } = getExpenseIcon(expense.name);

  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-[#F6F7F8] p-4">
      {/* Top row: Icon + Name/Meta + Amount */}
      <div className="flex items-center gap-3.5">
        {/* Icon */}
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px]", bg)}>
          <Icon className={cn("size-[22px]", color)} />
        </div>

        {/* Name + Meta */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold text-[#1A1A1A]">
            {expense.name}
          </span>
          <span className="text-xs text-[#9CA3AF]">
            {expense.creatorName ? `${expense.creatorName} · ` : ""}
            {formatRelativeTime(expense.createdAt)}
          </span>
        </div>

        {/* Amount */}
        <span className="shrink-0 text-[22px] font-extrabold tabular-nums text-[#1A1A1A]">
          {new Intl.NumberFormat("vi-VN").format(expense.amount)}
        </span>
      </div>

      {/* Action row: Attach + Reject + Approve */}
      {canApprove && (
        <div className="flex items-center gap-2.5">
          {/* Attachment button */}
          {!expense.attachmentUrl ? (
            <div className="shrink-0">
              <AttachmentUpload
                expenseId={expense.id}
                onUpload={(url) => onAttachment(expense.id, url)}
              />
            </div>
          ) : (
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-[#FDF2F8]">
              <ImagePlus className="size-[18px] text-pink-500" />
            </div>
          )}

          {/* Reject */}
          <button
            onClick={() => onReject(expense.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FFF5F5] h-[38px] text-[13px] font-semibold text-red-500 transition-transform active:scale-[0.97]"
          >
            <X className="size-3.5" />
            Reject
          </button>

          {/* Approve */}
          <button
            onClick={() => onApprove(expense.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F0FDF4] h-[38px] text-[13px] font-semibold text-emerald-500 transition-transform active:scale-[0.97]"
          >
            <Check className="size-3.5" />
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
