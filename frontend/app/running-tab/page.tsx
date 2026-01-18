"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useOwnerStore } from "@/stores/ownerStore";
import { useRunningTabStore } from "@/stores/runningTabStore";
import { usePermissionsStore } from "@/stores/permissionsStore";
import { BalanceDisplay, formatVND } from "@/components/running-tab/BalanceDisplay";
import { InitializeBalanceForm } from "@/components/running-tab/InitializeBalanceForm";
import { AddExpenseModal } from "@/components/running-tab/AddExpenseModal";
import { ExpenseList } from "@/components/running-tab/ExpenseList";
import { TabHistory } from "@/components/running-tab/TabHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function RunningTabPage() {
  // Redirect to login if not authenticated
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthGuard();

  // Hydration-safe state
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
  const rejectExpense = useRunningTabStore((state) => state.rejectExpense);
  const setAttachment = useRunningTabStore((state) => state.setAttachment);

  // Balance adjustment modal state (admin only)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const adjustAmountRef = useRef<HTMLInputElement>(null);

  // Permissions
  const canApproveExpenses = usePermissionsStore((state) => state.canApproveExpenses);

  // Derived state (hydration-safe)
  const activeOwnerId = isMounted ? getActiveOwnerId() : null;
  const isMaster = isMounted ? isMasterLoggedIn() : false;
  const isTabInitialized = isMounted && tab !== null;
  const userCanApprove = isMounted && activeOwnerId ? canApproveExpenses(activeOwnerId) : false;

  // Owner list for display (simplified)
  const ownerList = useMemo(() => {
    return owners.map((o) => ({ id: o.id, name: o.name }));
  }, [owners]);

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

  const handleReject = (id: string) => {
    rejectExpense(id, activeOwnerId);
  };

  const handleAttachment = (expenseId: string, url: string) => {
    setAttachment(expenseId, url);
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

  // Show loading state while checking authentication
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show loading state while hydrating
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Show Initialize Form if not initialized (master only) */}
          {!isTabInitialized && isMaster && (
            <InitializeBalanceForm onInitialize={handleInitialize} />
          )}

          {/* Show message if not initialized and not master */}
          {!isTabInitialized && !isMaster && (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Tab Not Initialized</CardTitle>
                <CardDescription>
                  The running tab has not been set up yet. Please ask a master
                  account holder to initialize the starting balance.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Main Content - only show if initialized */}
          {isTabInitialized && (
            <>
              {/* Balance Display - no card, just giant number */}
              <div className="relative">
                <BalanceDisplay amount={tab.currentBalance} />
                {/* Admin edit button */}
                {isMaster && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                    onClick={openAdjustModal}
                    title="Adjust balance"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Add Expense Button */}
              <div className="flex justify-center">
                <AddExpenseModal
                  onAddExpense={handleAddExpense}
                  onAddBulkExpenses={handleAddBulkExpenses}
                />
              </div>

              {/* Expense List - each section has its own card */}
              <ExpenseList
                expenses={expenses}
                owners={ownerList}
                canApprove={userCanApprove}
                onApprove={handleApprove}
                onReject={handleReject}
                onAttachment={handleAttachment}
              />

              {/* Tab History */}
              <TabHistory history={history} owners={ownerList} />
            </>
          )}
        </div>
      </main>

      {/* Balance Adjustment Modal (Admin Only) */}
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
              <label className="text-sm font-medium">New Balance (VND)</label>
              <Input
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
              <label className="text-sm font-medium">Reason</label>
              <Input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g., Cash reload, Correction, etc."
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!adjustAmount || !adjustReason.trim()}>
                Update Balance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
