"use client";

import { useMemo, useState, useRef } from "react";
import type { Expense, ExpenseWithOwner } from "@/types/runningTab";
import { ExpenseItem } from "./ExpenseItem";
import { PendingApproval } from "./PendingApproval";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        {/* Pending Section — Pencil redesign */}
        {pending.length > 0 && (
          <PendingApproval
            expenses={pending}
            canApprove={canApprove}
            onApprove={onApprove}
            onApproveAll={onApproveAll}
            onReject={handleRejectClick}
            onRejectAll={onRejectAll ? () => {
              setRejectAllReason("");
              setRejectAllDialogOpen(true);
              setTimeout(() => rejectAllReasonRef.current?.focus(), 50);
            } : undefined}
            onAttachment={onAttachment}
          />
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
