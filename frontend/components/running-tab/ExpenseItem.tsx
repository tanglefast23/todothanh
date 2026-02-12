"use client";

import { useState } from "react";
import { Check, X, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatVND } from "./BalanceDisplay";
import { formatRelativeTime } from "@/lib/formatters";
import { getExpenseIcon, getExpenseCatImage } from "@/lib/expenseIcons";
import type { Expense, ExpenseStatus } from "@/types/runningTab";
import { AttachmentUpload } from "./AttachmentUpload";

interface ExpenseItemProps {
  expense: Expense;
  creatorName?: string;
  approverName?: string;
  canApprove: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAttachment: (id: string, url: string) => void;
  itemNumber?: number;
  showNumber?: boolean;
}

// Rainbow gradient colors for item numbers
const NUMBER_COLORS = [
  "from-pink-500 to-rose-500",
  "from-orange-500 to-amber-500",
  "from-yellow-500 to-lime-500",
  "from-green-500 to-emerald-500",
  "from-teal-500 to-cyan-500",
  "from-blue-500 to-indigo-500",
  "from-violet-500 to-purple-500",
  "from-fuchsia-500 to-pink-500",
];

/** Renders the expense icon — either a cat photo or a Lucide icon in a colored container. */
function ExpenseIconDisplay({ name }: { name: string }) {
  const catImage = getExpenseCatImage(name);

  if (catImage === "both") {
    return (
      <div className="flex -space-x-1">
        <img src="/ivory.PNG" alt="Ivory" className="w-6 h-7 rounded object-contain" />
        <img src="/tom.png" alt="Tom" className="w-6 h-7 rounded object-contain" />
      </div>
    );
  }

  if (catImage) {
    const imgSrc = catImage === "ivory" ? "/ivory.PNG" : "/tom.png";
    const altText = catImage === "ivory" ? "Ivory" : "Tom";
    return (
      <img src={imgSrc} alt={altText} className="w-7 h-8 rounded object-contain" />
    );
  }

  const { Icon, color, bg } = getExpenseIcon(name);
  return (
    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", bg)}>
      <Icon className={cn("size-[18px]", color)} />
    </div>
  );
}

const statusConfig: Record<
  ExpenseStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  pending: {
    label: "Pending",
    variant: "outline",
    className: "border-amber-400 text-amber-500 bg-amber-500/10",
  },
  approved: {
    label: "Approved",
    variant: "default",
    className: "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    className: "bg-gradient-to-r from-red-500 to-rose-500 text-white border-0",
  },
};

export function ExpenseItem({
  expense,
  creatorName,
  approverName,
  canApprove,
  onApprove,
  onReject,
  onAttachment,
  itemNumber,
  showNumber = false,
}: ExpenseItemProps) {
  const [imageError, setImageError] = useState(false);
  const config = statusConfig[expense.status];
  const isPending = expense.status === "pending";
  const numberColor = itemNumber ? NUMBER_COLORS[(itemNumber - 1) % NUMBER_COLORS.length] : NUMBER_COLORS[0];

  // Check if attachment is a PDF
  const isPdf = expense.attachmentUrl?.toLowerCase().includes(".pdf");

  // Get card style based on status
  const getCardStyle = () => {
    switch (expense.status) {
      case "approved":
        return "bg-gradient-to-br from-emerald-500/8 via-transparent to-green-500/8 border-emerald-400/30 shadow-sm shadow-emerald-500/5";
      case "rejected":
        return "bg-gradient-to-br from-red-500/8 via-transparent to-rose-500/8 border-red-400/30 shadow-sm shadow-red-500/5";
      default:
        return "bg-gradient-to-br from-amber-500/8 via-transparent to-yellow-500/8 border-amber-400/30 shadow-sm shadow-amber-500/5";
    }
  };

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01] ${getCardStyle()}`}>
      {/* Item Number */}
      {showNumber && itemNumber && (
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${numberColor} flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white/20`}
        >
          {itemNumber}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <ExpenseIconDisplay name={expense.name} />
          <h4 className="font-semibold text-sm truncate tracking-tight">{expense.name}</h4>
          {/* Only show status badge for non-pending expenses */}
          {expense.status !== "pending" && (
            <Badge variant={config.variant} className={cn(config.className, "shadow-sm")}>
              {config.label}
            </Badge>
          )}
        </div>

        <p className="text-xl font-bold mt-1.5 tracking-tight tabular-nums">{formatVND(expense.amount)}</p>

        <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground/80 flex-wrap">
          {creatorName && (
            <span className="inline-flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-current opacity-40" />
              <span className="font-medium text-foreground/60">{creatorName}</span>
            </span>
          )}
          <span className="opacity-60">{formatRelativeTime(expense.createdAt)}</span>
          {expense.status !== "pending" && approverName && (
            <>
              <span className="opacity-30">•</span>
              <span>
                {expense.status === "approved" ? "✓" : "✗"}{" "}
                <span className="font-medium text-foreground/60">{approverName}</span>
              </span>
            </>
          )}
        </div>

        {/* Rejection Reason - only for rejected expenses */}
        {expense.status === "rejected" && expense.rejectionReason && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-600">
              <span className="font-semibold">Reason:</span>{" "}
              <span className="opacity-90">{expense.rejectionReason}</span>
            </p>
          </div>
        )}

        {/* Attachment Thumbnail */}
        {expense.attachmentUrl && (
          <div className="mt-3">
            <a
              href={expense.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-block"
            >
              {isPdf || imageError ? (
                // PDF or failed image - show icon with link
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary">
                      {isPdf ? "PDF Document" : "Attachment"}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Tap to view <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ) : (
                // Image - show thumbnail
                <div className="relative overflow-hidden rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <img
                    src={expense.attachmentUrl}
                    alt="Expense attachment"
                    className="w-20 h-20 object-cover group-hover:scale-105 transition-transform"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
              )}
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Attachment button or thumbnail - only for pending expenses */}
        {isPending && !expense.attachmentUrl && (
          <AttachmentUpload
            expenseId={expense.id}
            onUpload={(url) => onAttachment(expense.id, url)}
          />
        )}
        {isPending && expense.attachmentUrl && (
          <a
            href={expense.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block"
            title="View attachment"
          >
            {isPdf || imageError ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/50 hover:border-pink-400 transition-all">
                <FileText className="h-4 w-4 text-pink-500" />
              </div>
            ) : (
              <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-pink-400/50 hover:border-pink-400 transition-all">
                <img
                  src={expense.attachmentUrl}
                  alt="Attachment"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
            )}
          </a>
        )}

        {/* Approve/Reject buttons - only for pending and authorized users */}
        {isPending && canApprove && (
          <>
            <Button
              variant="outline"
              className="h-10 w-10 p-0 rounded-xl text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/40 shadow-sm transition-all duration-200 active:scale-90"
              onClick={() => onApprove(expense.id)}
              title="Approve expense"
            >
              <Check className="h-5 w-5" />
              <span className="sr-only">Approve</span>
            </Button>
            <Button
              variant="outline"
              className="h-10 w-10 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/20 border-red-500/40 shadow-sm transition-all duration-200 active:scale-90"
              onClick={() => onReject(expense.id)}
              title="Reject expense"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Reject</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
