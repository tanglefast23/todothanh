"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Trash2, Plus, Check, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useOwnerStore } from "@/stores/ownerStore";
import { useRunningTabStore } from "@/stores/runningTabStore";
import { usePermissionsStore } from "@/stores/permissionsStore";
import { BalanceDisplay, formatVND } from "@/components/running-tab/BalanceDisplay";
import { InitializeBalanceForm } from "@/components/running-tab/InitializeBalanceForm";
import { AddExpenseModal } from "@/components/running-tab/AddExpenseModal";
import type { AddExpenseModalHandle } from "@/components/running-tab/AddExpenseModal";
import { ExpenseShortcuts } from "@/components/running-tab/ExpenseShortcuts";
import { ExpenseList } from "@/components/running-tab/ExpenseList";
import { TabHistory } from "@/components/running-tab/TabHistory";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatRelativeTime } from "@/lib/formatters";
import type { TabHistoryEntry, TabHistoryType } from "@/types/runningTab";

// History type config for Recent Activity icons
const historyIconConfig: Record<TabHistoryType, { bg: string; color: string; icon: "check" | "plus" | "x" | "minus" | "settings" }> = {
  initial: { bg: "bg-blue-50", color: "text-blue-500", icon: "plus" },
  add: { bg: "bg-indigo-50", color: "text-indigo-500", icon: "plus" },
  expense_approved: { bg: "bg-green-50", color: "text-green-500", icon: "check" },
  expense_rejected: { bg: "bg-rose-50", color: "text-red-500", icon: "x" },
  adjustment: { bg: "bg-amber-50", color: "text-amber-500", icon: "settings" },
};

function HistoryIcon({ type }: { type: TabHistoryType }) {
  const config = historyIconConfig[type];
  const iconMap = {
    check: <Check className="size-4" />,
    plus: <Plus className="size-4" />,
    x: <X className="size-4" />,
    minus: <Trash2 className="size-4" />,
    settings: <Plus className="size-4" />,
  };
  return (
    <div className={`flex size-9 shrink-0 items-center justify-center rounded-[18px] ${config.bg} ${config.color}`}>
      {iconMap[config.icon]}
    </div>
  );
}

const historyTypeLabel: Record<TabHistoryType, string> = {
  initial: "Initial Balance",
  add: "Balance top-up",
  expense_approved: "Expense approved",
  expense_rejected: "Expense rejected",
  adjustment: "Balance adjusted",
};

export default function RunningTabPage() {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthGuard();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Owner state
  const getActiveOwnerId = useOwnerStore((state) => state.getActiveOwnerId);
  const isMasterLoggedIn = useOwnerStore((state) => state.isMasterLoggedIn);
  const owners = useOwnerStore((state) => state.owners);

  // Running tab state
  const tab = useRunningTabStore((state) => state.tab);
  const expenses = useRunningTabStore((state) => state.expenses);
  const history = useRunningTabStore((state) => state.history);
  const initializeBalance = useRunningTabStore((state) => state.initializeBalance);
  const adjustBalance = useRunningTabStore((state) => state.adjustBalance);
  const addExpense = useRunningTabStore((state) => state.addExpense);
  const addBulkExpenses = useRunningTabStore((state) => state.addBulkExpenses);
  const approveExpense = useRunningTabStore((state) => state.approveExpense);
  const approveAllPendingExpenses = useRunningTabStore((state) => state.approveAllPendingExpenses);
  const rejectAllPendingExpenses = useRunningTabStore((state) => state.rejectAllPendingExpenses);
  const rejectExpense = useRunningTabStore((state) => state.rejectExpense);
  const setAttachment = useRunningTabStore((state) => state.setAttachment);
  const clearCompletedExpenses = useRunningTabStore((state) => state.clearCompletedExpenses);
  const autoCleanExpiredExpenses = useRunningTabStore((state) => state.autoCleanExpiredExpenses);

  useEffect(() => {
    if (isMounted) {
      autoCleanExpiredExpenses();
    }
  }, [isMounted, autoCleanExpiredExpenses]);

  // Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const adjustAmountRef = useRef<HTMLInputElement>(null);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [topUpConfirmOpen, setTopUpConfirmOpen] = useState(false);

  // Prefilled expense state
  const [prefilledExpenseName, setPrefilledExpenseName] = useState("");
  const [prefilledExpenseTab, setPrefilledExpenseTab] = useState<"simple" | "bulk">("simple");

  // Refs
  const proxyFocusRef = useRef<HTMLInputElement>(null);
  const addExpenseRef = useRef<AddExpenseModalHandle>(null);

  // Permissions
  const canApproveExpenses = usePermissionsStore((state) => state.canApproveExpenses);

  // Derived state
  const activeOwnerId = isMounted ? getActiveOwnerId() : null;
  const isMaster = isMounted ? isMasterLoggedIn() : false;
  const isTabInitialized = isMounted && tab !== null;
  const userCanApprove = isMounted && activeOwnerId ? canApproveExpenses(activeOwnerId) : false;

  const ownerList = useMemo(() => {
    return owners.map((o) => ({ id: o.id, name: o.name }));
  }, [owners]);

  // Recent activity: 3 most recent history entries
  const recentActivity = useMemo(() => {
    return history.slice(0, 3);
  }, [history]);

  // Monthly summary: aggregate current month stats
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalAdded = 0;
    let totalSpent = 0;
    let expenseCount = 0;

    for (const entry of history) {
      const entryDate = new Date(entry.createdAt);
      if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
        if (entry.type === "add" || entry.type === "initial" || entry.type === "adjustment") {
          if (entry.amount > 0) totalAdded += entry.amount;
        }
        if (entry.type === "expense_approved") {
          totalSpent += Math.abs(entry.amount);
          expenseCount++;
        }
      }
    }

    const monthLabel = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { totalAdded, totalSpent, expenseCount, monthLabel };
  }, [history]);

  // Handlers
  const handleInitialize = (amount: number) => {
    initializeBalance(amount, activeOwnerId);
  };

  const handleAddExpense = (name: string, amount: number) => {
    addExpense(name, amount, activeOwnerId);
  };

  const handleAddBulkExpenses = (entries: { name: string; amount: number }[]) => {
    addBulkExpenses(entries, activeOwnerId);
  };

  const handleApprove = (id: string) => {
    approveExpense(id, activeOwnerId);
  };

  const handleApproveAll = () => {
    approveAllPendingExpenses(activeOwnerId);
  };

  const handleRejectAll = (reason: string) => {
    rejectAllPendingExpenses(reason, activeOwnerId);
  };

  const handleReject = (id: string, reason: string) => {
    rejectExpense(id, reason, activeOwnerId);
  };

  const handleAttachment = (expenseId: string, url: string) => {
    setAttachment(expenseId, url);
  };

  const handleShortcutSelectExpense = (name: string, tab: "simple" | "bulk" = "simple") => {
    proxyFocusRef.current?.focus({ preventScroll: true });
    setPrefilledExpenseTab(tab);
    setPrefilledExpenseName(name);
  };

  // Balance adjustment handlers
  const openAdjustModal = () => {
    if (tab) {
      setAdjustAmount(tab.currentBalance.toLocaleString("vi-VN"));
      setAdjustReason("");
      setAdjustModalOpen(true);
      setTimeout(() => adjustAmountRef.current?.focus(), 50);
    }
  };

  const handleAdjustAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value) {
      const num = parseInt(value, 10);
      setAdjustAmount(num.toLocaleString("vi-VN"));
    } else {
      setAdjustAmount("");
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(adjustAmount.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(numAmount) && adjustReason.trim()) {
      adjustBalance(numAmount, adjustReason.trim(), activeOwnerId);
      setAdjustModalOpen(false);
      setAdjustAmount("");
      setAdjustReason("");
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hidden proxy input for iOS keyboard */}
      <input
        ref={proxyFocusRef}
        type="tel"
        inputMode="numeric"
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: 'fixed', opacity: 0, top: 0, left: 0, width: '1px', height: '1px', padding: 0, border: 'none', pointerEvents: 'none' }}
      />
      <Header />

      <main className="flex-1 px-4 py-5 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-7">
          {/* Show Initialize Form if not initialized (master only) */}
          {!isTabInitialized && isMaster && (
            <InitializeBalanceForm onInitialize={handleInitialize} />
          )}

          {/* Show message if not initialized and not master */}
          {!isTabInitialized && !isMaster && (
            <Card className="max-w-md mx-auto border-2 shadow-lg">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 mx-auto mb-3">
                  <span className="text-2xl">💳</span>
                </div>
                <CardTitle className="text-xl tracking-tight">Tab Not Initialized</CardTitle>
                <CardDescription className="text-sm">
                  The running tab has not been set up yet. Please ask a master
                  account holder to initialize the starting balance.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Main Content */}
          {isTabInitialized && (
            <>
              {/* Balance Display with action buttons inside */}
              <BalanceDisplay
                amount={tab.currentBalance}
                canEdit={isMaster}
                onEdit={openAdjustModal}
              >
                {/* Top-Up Button */}
                <button
                  onClick={() => setTopUpConfirmOpen(true)}
                  aria-label="Top up 5 million VND"
                  className="flex items-center justify-center gap-2 px-[18px] h-10 rounded-[20px] bg-[#B6F2CF] text-[#15803D] text-[13px] font-bold transition-transform active:scale-95"
                >
                  <span className="text-2xl font-black leading-none">+</span>
                  5M Top Up
                </button>

                {/* Single expense button */}
                <button
                  type="button"
                  onClick={() => addExpenseRef.current?.openWithTab("simple")}
                  className="flex items-center justify-center gap-1.5 px-[18px] h-10 rounded-[20px] bg-white text-[#FF6B6B] text-[13px] font-bold transition-transform active:scale-95"
                >
                  <span className="text-2xl font-black leading-none">+</span>
                  Single
                </button>

                {/* Bulk expense button */}
                <button
                  type="button"
                  onClick={() => addExpenseRef.current?.openWithTab("bulk")}
                  className="flex items-center justify-center gap-1.5 px-[18px] h-10 rounded-[20px] bg-white text-[#FF6B6B] text-[13px] font-bold transition-transform active:scale-95"
                >
                  <span className="text-2xl font-black leading-none">+</span>
                  Bulk
                </button>
              </BalanceDisplay>

              {/* AddExpenseModal (hidden trigger, opened via ref) */}
              <AddExpenseModal
                ref={addExpenseRef}
                onAddExpense={handleAddExpense}
                onAddBulkExpenses={handleAddBulkExpenses}
                prefilledName={prefilledExpenseName}
                prefilledTab={prefilledExpenseTab}
                onClearPrefilled={() => {
                  setPrefilledExpenseName("");
                  setPrefilledExpenseTab("simple");
                }}
              />

              {/* Quick Add Shortcuts */}
              <ExpenseShortcuts onSelectExpense={handleShortcutSelectExpense} />

              {/* Expense List (Pending + Approved + Rejected) */}
              <ExpenseList
                expenses={expenses}
                owners={ownerList}
                canApprove={userCanApprove}
                onApprove={handleApprove}
                onApproveAll={userCanApprove ? handleApproveAll : undefined}
                onReject={handleReject}
                onRejectAll={userCanApprove ? handleRejectAll : undefined}
                onAttachment={handleAttachment}
              />

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <RecentActivitySection entries={recentActivity} />
              )}

              {/* Monthly Summary */}
              {history.length > 0 && (
                <MonthlySummarySection
                  totalAdded={monthlySummary.totalAdded}
                  totalSpent={monthlySummary.totalSpent}
                  expenseCount={monthlySummary.expenseCount}
                  monthLabel={monthlySummary.monthLabel}
                />
              )}

              {/* Tab History */}
              <TabHistory history={history} owners={ownerList} />

              {/* Clear Button */}
              {isMaster && (expenses.filter(e => e.status !== "pending").length > 0) && (
                <button
                  onClick={() => setClearAllModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-[14px] bg-white border-[1.5px] border-red-300 text-sm font-semibold text-red-500 transition-transform active:scale-[0.98]"
                >
                  <Trash2 className="size-[18px]" />
                  Clear Approved &amp; Rejected
                </button>
              )}
            </>
          )}
        </div>
      </main>

      {/* Clear All Confirmation Modal */}
      <Dialog open={clearAllModalOpen} onOpenChange={setClearAllModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear Completed Expenses</DialogTitle>
            <DialogDescription>
              This will permanently delete all approved and rejected expenses. Pending expenses will be kept. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClearAllModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                clearCompletedExpenses();
                setClearAllModalOpen(false);
              }}
            >
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Adjustment Modal */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
            <DialogDescription>
              Manually change the current balance. Current: {tab ? formatVND(tab.currentBalance) : "0 ₫"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <label htmlFor="adjust-balance" className="text-sm font-medium">New Balance (VND)</label>
              <Input
                id="adjust-balance"
                ref={adjustAmountRef}
                type="text"
                inputMode="numeric"
                value={adjustAmount}
                onChange={handleAdjustAmountChange}
                placeholder="Enter new balance"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="adjust-reason" className="text-sm font-medium">Reason</label>
              <Input
                id="adjust-reason"
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g., Cash reload, Correction, etc."
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!adjustAmount || !adjustReason.trim()}>
                Update Balance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Top-Up Confirmation Dialog */}
      <Dialog open={topUpConfirmOpen} onOpenChange={setTopUpConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Top Up</DialogTitle>
            <DialogDescription>
              Are you sure you want to request a top up of 5,000,000 VND? This will need to be approved by a master account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTopUpConfirmOpen(false)}>
              No
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                addExpense("Kia Top Up", 5000000, activeOwnerId);
                setTopUpConfirmOpen(false);
              }}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Recent Activity Section ---

function RecentActivitySection({
  entries,
}: {
  entries: TabHistoryEntry[];
}) {

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight text-foreground">Recent Activity</h3>
        <span className="text-[13px] font-semibold text-[#FF6B6B]">See all</span>
      </div>

      <div className="rounded-[20px] bg-[#F6F7F8] overflow-hidden">
        {entries.map((entry, index) => {
          const isPositive = entry.amount > 0;
          const isNeutral = entry.amount === 0;
          const label = entry.description || historyTypeLabel[entry.type];

          return (
            <div key={entry.id}>
              {index > 0 && (
                <div className="mx-4 h-px bg-[#E5E7EB]" />
              )}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <HistoryIcon type={entry.type} />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-[#1A1A1A] truncate">
                    {label}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${
                  isNeutral ? "text-[#9CA3AF]" : isPositive ? "text-emerald-500" : "text-red-500"
                }`}>
                  {isPositive ? "+" : ""}{formatVND(entry.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- Monthly Summary Section ---

function MonthlySummarySection({
  totalAdded,
  totalSpent,
  expenseCount,
  monthLabel,
}: {
  totalAdded: number;
  totalSpent: number;
  expenseCount: number;
  monthLabel: string;
}) {
  function formatShort(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K`;
    }
    return String(value);
  }

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight text-foreground">This Month</h3>
        <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-xl">
          {monthLabel}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col gap-1.5 rounded-[18px] bg-[#F0FDF4] p-4">
          <span className="text-2xl font-extrabold text-emerald-500 tracking-tight">
            {formatShort(totalAdded)}
          </span>
          <span className="text-xs font-medium text-[#6B7280]">Added</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[18px] bg-[#FFF1F2] p-4">
          <span className="text-2xl font-extrabold text-red-500 tracking-tight">
            {formatShort(totalSpent)}
          </span>
          <span className="text-xs font-medium text-[#6B7280]">Spent</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[18px] bg-[#F6F7F8] p-4">
          <span className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight">
            {expenseCount}
          </span>
          <span className="text-xs font-medium text-[#6B7280]">Expenses</span>
        </div>
      </div>
    </section>
  );
}
