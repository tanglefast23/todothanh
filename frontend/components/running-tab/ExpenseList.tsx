"use client";

import { useMemo, useState, useRef } from "react";
import { ChevronDown, CheckCheck, XIcon } from "lucide-react";
import type { Expense, ExpenseWithOwner } from "@/types/runningTab";
import { ExpenseItem } from "./ExpenseItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExpenseListProps {
  expenses: Expense[];
  owners: { id: string; name: string }[];
  canApprove: boolean;
  onApprove: (id: string) => void;
  onApproveAll?: () => void;
  onReject: (id: string, reason: string) => void;
  onRejectAll?: (reason: string) => void;
  onAttachment: (id: string, url: string) => void;
}

export function ExpenseList({
  expenses,
  owners,
  canApprove,
  onApprove,
  onApproveAll,
  onReject,
  onRejectAll,
  onAttachment,
}: ExpenseListProps) {
  // Collapsible section state - Approved and Rejected collapsed by default
  const [approvedExpanded, setApprovedExpanded] = useState(false);
  const [rejectedExpanded, setRejectedExpanded] = useState(false);

  // Rejection reason dialog state (single expense)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectExpenseId, setRejectExpenseId] = useState<string | null>(null);
  const [rejectExpenseName, setRejectExpenseName] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");
  const rejectReasonRef = useRef<HTMLInputElement>(null);

  // Reject all dialog state
  const [rejectAllDialogOpen, setRejectAllDialogOpen] = useState(false);
  const [rejectAllReason, setRejectAllReason] = useState("");
  const rejectAllReasonRef = useRef<HTMLInputElement>(null);

  // Handle reject button click - opens dialog
  const handleRejectClick = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (expense) {
      setRejectExpenseId(id);
      setRejectExpenseName(expense.name);
      setRejectReason("");
      setRejectDialogOpen(true);
      setTimeout(() => rejectReasonRef.current?.focus(), 50);
    }
  };

  // Handle rejection confirmation
  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectExpenseId && rejectReason.trim()) {
      onReject(rejectExpenseId, rejectReason.trim());
      setRejectDialogOpen(false);
      setRejectExpenseId(null);
      setRejectReason("");
    }
  };
  // Group expenses by status
  const { pending, approved, rejected } = useMemo(() => {
    const ownerMap = new Map(owners.map((o) => [o.id, o.name]));

    const enrichExpense = (e: Expense): ExpenseWithOwner => ({
      ...e,
      creatorName: e.createdBy ? ownerMap.get(e.createdBy) : undefined,
      approverName: e.approvedBy ? ownerMap.get(e.approvedBy) : undefined,
    });

    return {
      pending: expenses
        .filter((e) => e.status === "pending")
        .map(enrichExpense)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      approved: expenses
        .filter((e) => e.status === "approved")
        .map(enrichExpense)
        .sort((a, b) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime()),
      rejected: expenses
        .filter((e) => e.status === "rejected")
        .map(enrichExpense)
        .sort((a, b) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime()),
    };
  }, [expenses, owners]);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
          <span className="text-3xl">💸</span>
        </div>
        <p className="font-medium text-foreground/80">No expenses yet</p>
        <p className="text-sm mt-1 text-muted-foreground/70">Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Pending Section */}
        {pending.length > 0 && (
          <Card className="border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/10 shadow-lg shadow-amber-500/5 overflow-hidden">
            <CardHeader className="pb-3 border-b border-amber-400/10">
              <CardTitle className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-between font-bold tracking-tight">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Pending</span>
                  <span className="text-sm font-normal text-amber-400/70">({pending.length})</span>
                </div>
                {canApprove && pending.length > 1 && (
                  <div className="flex items-center gap-2">
                    {onApproveAll && (
                      <button
                        onClick={onApproveAll}
                        className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all duration-200 active:scale-95 shadow-sm"
                        title="Approve all pending expenses"
                      >
                        <CheckCheck className="h-5 w-5" />
                      </button>
                    )}
                    {onRejectAll && (
                      <button
                        onClick={() => {
                          setRejectAllReason("");
                          setRejectAllDialogOpen(true);
                          setTimeout(() => rejectAllReasonRef.current?.focus(), 50);
                        }}
                        className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all duration-200 active:scale-95 shadow-sm"
                        title="Reject all pending expenses"
                      >
                        <div className="flex">
                          <XIcon className="h-4 w-4" />
                          <XIcon className="h-4 w-4 -ml-2" />
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ExpenseSection
                expenses={pending}
                canApprove={canApprove}
                onApprove={onApprove}
                onReject={handleRejectClick}
                onAttachment={onAttachment}
              />
            </CardContent>
          </Card>
        )}

        {/* Approved Section - Collapsible */}
        {approved.length > 0 && (
          <Card className="border-2 border-emerald-400/40 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-green-500/10 shadow-lg shadow-emerald-500/5 overflow-hidden">
            <CardHeader
              className="pb-3 cursor-pointer select-none border-b border-emerald-400/10 hover:bg-emerald-500/5 transition-colors"
              onClick={() => setApprovedExpanded(!approvedExpanded)}
            >
              <CardTitle className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 flex items-center justify-between font-bold tracking-tight">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Approved</span>
                  <span className="text-sm font-normal text-emerald-400/70">({approved.length})</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-emerald-400 transition-transform duration-300",
                    approvedExpanded && "rotate-180"
                  )}
                />
              </CardTitle>
            </CardHeader>
            {approvedExpanded && (
              <CardContent className="pt-4 animate-fade-in-up">
                <ExpenseSection
                  expenses={approved}
                  canApprove={canApprove}
                  onApprove={onApprove}
                  onReject={handleRejectClick}
                  onAttachment={onAttachment}
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* Rejected Section - Collapsible */}
        {rejected.length > 0 && (
          <Card className="border-2 border-red-400/40 bg-gradient-to-br from-red-500/10 via-red-500/5 to-rose-500/10 shadow-lg shadow-red-500/5 overflow-hidden">
            <CardHeader
              className="pb-3 cursor-pointer select-none border-b border-red-400/10 hover:bg-red-500/5 transition-colors"
              onClick={() => setRejectedExpanded(!rejectedExpanded)}
            >
              <CardTitle className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400 flex items-center justify-between font-bold tracking-tight">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span>Rejected</span>
                  <span className="text-sm font-normal text-red-400/70">({rejected.length})</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-red-400 transition-transform duration-300",
                    rejectedExpanded && "rotate-180"
                  )}
                />
              </CardTitle>
            </CardHeader>
            {rejectedExpanded && (
              <CardContent className="pt-4 animate-fade-in-up">
                <ExpenseSection
                  expenses={rejected}
                  canApprove={canApprove}
                  onApprove={onApprove}
                  onReject={handleRejectClick}
                  onAttachment={onAttachment}
                />
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting &quot;{rejectExpenseName}&quot;.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectConfirm} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                ref={rejectReasonRef}
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Duplicate entry, Not approved, Invalid amount"
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!rejectReason.trim()}
              >
                Reject Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject All Dialog */}
      <Dialog open={rejectAllDialogOpen} onOpenChange={setRejectAllDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject All Expenses</DialogTitle>
            <DialogDescription>
              This will reject all {pending.length} pending expenses with the same reason.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (rejectAllReason.trim() && onRejectAll) {
                onRejectAll(rejectAllReason.trim());
                setRejectAllDialogOpen(false);
                setRejectAllReason("");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                ref={rejectAllReasonRef}
                type="text"
                value={rejectAllReason}
                onChange={(e) => setRejectAllReason(e.target.value)}
                placeholder="e.g., Budget exceeded, Not approved this month"
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectAllDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!rejectAllReason.trim()}
              >
                Reject All ({pending.length})
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ExpenseSectionProps {
  expenses: ExpenseWithOwner[];
  canApprove: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAttachment: (id: string, url: string) => void;
}

function ExpenseSection({
  expenses,
  canApprove,
  onApprove,
  onReject,
  onAttachment,
}: ExpenseSectionProps) {
  const count = expenses.length;

  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          creatorName={expense.creatorName}
          approverName={expense.approverName}
          canApprove={canApprove}
          onApprove={onApprove}
          onReject={onReject}
          onAttachment={onAttachment}
          itemNumber={index + 1}
          showNumber={count > 1}
        />
      ))}
    </div>
  );
}
