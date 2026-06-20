/**
 * Running Tab Zustand store with localStorage persistence
 * Manages the running tab balance, expenses, and history
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  RunningTab,
  Expense,
  TabHistoryEntry,
  ExpenseStatus,
} from "@/types/runningTab";
import {
  deleteCompletedExpenses,
  deleteExpiredCompletedExpenses,
  updateExpense,
  upsertExpenses,
  deleteExpense as deleteExpenseFromSupabase,
} from "@/lib/supabase/queries/expenses";
import { upsertTab, updateTabBalance } from "@/lib/supabase/queries/runningTab";
import { upsertHistory } from "@/lib/supabase/queries/tabHistory";
import { deleteAttachments } from "@/lib/supabase/queries/storage";
import { retryWithBackoff } from "@/lib/supabase/sync/utils";

const RUNNING_TAB_STORAGE_KEY = "running-tab-storage";
const MAX_SEARCHED_MONTHS = 12;

/** Expense name that triggers a balance top-up rather than a deduction. */
export const TOPUP_EXPENSE_NAME = "Kia Top Up";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface RunningTabState {
  tab: RunningTab | null;
  expenses: Expense[];
  history: TabHistoryEntry[];

  // Searched history (keyed by "YYYY-MM", persisted to localStorage)
  searchedHistory: Record<string, TabHistoryEntry[]>;

  // Bulk setters for Supabase sync
  setTab: (tab: RunningTab | null) => void;
  setExpenses: (expenses: Expense[]) => void;
  setHistory: (history: TabHistoryEntry[]) => void;

  // Searched history actions
  setSearchedMonth: (key: string, entries: TabHistoryEntry[]) => void;
  removeSearchedMonth: (key: string) => void;
  clearAllSearchedHistory: () => void;

  // Tab management
  initializeBalance: (amount: number, initializedBy: string | null) => void;
  adjustBalance: (newBalance: number, reason: string, adjustedBy: string | null) => void;
  addToBalance: (amount: number, description: string, addedBy: string | null) => void;

  // Expense CRUD
  addExpense: (name: string, amount: number, createdBy: string | null) => string;
  addBulkExpenses: (
    entries: { name: string; amount: number }[],
    createdBy: string | null
  ) => string[];
  approveExpense: (id: string, approvedBy: string | null) => void;
  approveAllPendingExpenses: (approvedBy: string | null) => void;
  rejectAllPendingExpenses: (reason: string, rejectedBy: string | null) => void;
  rejectExpense: (id: string, reason: string, approvedBy: string | null) => void;
  setAttachment: (expenseId: string, url: string) => void;
  deleteExpense: (id: string) => void;
  clearCompletedExpenses: () => void;
  autoCleanExpiredExpenses: () => void;

  // Getters
  getTabBalance: () => number;
  getPendingExpenses: () => Expense[];
  getApprovedExpenses: () => Expense[];
  getRejectedExpenses: () => Expense[];
}

export const useRunningTabStore = create<RunningTabState>()(
  persist(
    (set, get) => ({
      tab: null,
      expenses: [],
      history: [],
      searchedHistory: {},

      setTab: (tab) => set({ tab }),
      setExpenses: (expenses) => set({ expenses }),
      setHistory: (history) => set({ history }),

      setSearchedMonth: (key, entries) =>
        set((state) => {
          const next = { ...state.searchedHistory, [key]: entries };
          // Evict the oldest month(s) when the cap is exceeded so localStorage
          // doesn't grow unboundedly as users search more and more past months.
          const keys = Object.keys(next).sort(); // ascending = oldest first
          while (keys.length > MAX_SEARCHED_MONTHS) {
            delete next[keys.shift()!];
          }
          return { searchedHistory: next };
        }),
      removeSearchedMonth: (key) =>
        set((state) => {
          const next = { ...state.searchedHistory };
          delete next[key];
          return { searchedHistory: next };
        }),
      clearAllSearchedHistory: () => set({ searchedHistory: {} }),

      initializeBalance: (amount, initializedBy) => {
        const now = new Date().toISOString();
        const tabId = generateId();
        const historyId = generateId();

        const newTab: RunningTab = {
          id: tabId,
          initialBalance: amount,
          currentBalance: amount,
          initializedBy,
          initializedAt: now,
          updatedAt: now,
        };

        const historyEntry: TabHistoryEntry = {
          id: historyId,
          type: "initial",
          amount,
          description: "Initial balance set",
          relatedExpenseId: null,
          createdBy: initializedBy,
          createdAt: now,
        };

        // Single set() call for tab + history
        set((state) => ({
          tab: newTab,
          history: [historyEntry, ...state.history],
        }));

        // Sync to Supabase with retry
        retryWithBackoff(() => upsertTab(newTab), 3, "initializeBalance:tab").catch((error) => {
          console.error("[Store] Failed to sync tab initialization to Supabase after retries:", error);
        });
        retryWithBackoff(() => upsertHistory([historyEntry]), 3, "initializeBalance:history").catch((error) => {
          console.error("[Store] Failed to sync history entry to Supabase after retries:", error);
        });
      },

      adjustBalance: (newBalance, reason, adjustedBy) => {
        const currentTab = get().tab;
        if (!currentTab) return;

        const now = new Date().toISOString();
        const historyId = generateId();
        const difference = newBalance - currentTab.currentBalance;

        const historyEntry: TabHistoryEntry = {
          id: historyId,
          type: "adjustment",
          amount: difference,
          description: reason || "Manual balance adjustment",
          relatedExpenseId: null,
          createdBy: adjustedBy,
          createdAt: now,
        };

        // Single set() call for balance + history
        set((state) => ({
          tab: state.tab
            ? { ...state.tab, currentBalance: newBalance, updatedAt: now }
            : null,
          history: [historyEntry, ...state.history],
        }));

        // Sync to Supabase with retry
        retryWithBackoff(() => updateTabBalance(currentTab.id, newBalance), 3, "adjustBalance").catch((error) => {
          console.error("[Store] Failed to sync balance adjustment to Supabase after retries:", error);
        });
        retryWithBackoff(() => upsertHistory([historyEntry]), 3, "adjustBalance:history").catch((error) => {
          console.error("[Store] Failed to sync history entry to Supabase after retries:", error);
        });
      },

      addToBalance: (amount, description, addedBy) => {
        const currentTab = get().tab;
        if (!currentTab) return;

        const now = new Date().toISOString();
        const historyId = generateId();
        const newBalance = currentTab.currentBalance + amount;

        const historyEntry: TabHistoryEntry = {
          id: historyId,
          type: "add",
          amount,
          description: description || "Balance added",
          relatedExpenseId: null,
          createdBy: addedBy,
          createdAt: now,
        };

        // Single set() call for balance + history
        set((state) => ({
          tab: state.tab
            ? { ...state.tab, currentBalance: newBalance, updatedAt: now }
            : null,
          history: [historyEntry, ...state.history],
        }));

        // Sync to Supabase with retry
        retryWithBackoff(() => updateTabBalance(currentTab.id, newBalance), 3, "addToBalance").catch((error) => {
          console.error("[Store] Failed to sync balance addition to Supabase after retries:", error);
        });
        retryWithBackoff(() => upsertHistory([historyEntry]), 3, "addToBalance:history").catch((error) => {
          console.error("[Store] Failed to sync history entry to Supabase after retries:", error);
        });
      },

      addExpense: (name, amount, createdBy) => {
        const id = generateId();
        const now = new Date().toISOString();

        const newExpense: Expense = {
          id,
          name,
          amount,
          createdBy,
          createdAt: now,
          approvedBy: null,
          approvedAt: null,
          status: "pending",
          attachmentUrls: [],
          rejectionReason: null,
          updatedAt: now,
        };

        set((state) => ({
          expenses: [newExpense, ...state.expenses],
        }));

        // Sync to Supabase with retry so a network blip doesn't lose the write
        retryWithBackoff(() => upsertExpenses([newExpense]), 3, "addExpense").catch((error) => {
          console.error("[Store] Failed to sync new expense to Supabase after retries:", error);
        });

        return id;
      },

      addBulkExpenses: (entries, createdBy) => {
        const now = new Date().toISOString();
        const newExpenses: Expense[] = entries.map((entry) => ({
          id: generateId(),
          name: entry.name,
          amount: entry.amount,
          createdBy,
          createdAt: now,
          approvedBy: null,
          approvedAt: null,
          status: "pending" as ExpenseStatus,
          attachmentUrls: [],
          rejectionReason: null,
          updatedAt: now,
        }));

        set((state) => ({
          expenses: [...newExpenses, ...state.expenses],
        }));

        // Sync to Supabase with retry
        retryWithBackoff(() => upsertExpenses(newExpenses), 3, "addBulkExpenses").catch((error) => {
          console.error("[Store] Failed to sync bulk expenses to Supabase after retries:", error);
        });

        return newExpenses.map((e) => e.id);
      },

      approveExpense: (id, approvedBy) => {
        const expense = get().expenses.find((e) => e.id === id);
        const currentTab = get().tab;
        if (!expense || expense.status !== "pending") return;

        const now = new Date().toISOString();
        const historyId = generateId();

        // Check if this is a top-up (adds money) vs expense (subtracts money)
        const isTopUp = expense.name === TOPUP_EXPENSE_NAME;
        const balanceChange = isTopUp ? expense.amount : -expense.amount;
        const newBalance = (currentTab?.currentBalance ?? 0) + balanceChange;

        const historyEntry: TabHistoryEntry = {
          id: historyId,
          type: isTopUp ? "add" : "expense_approved",
          amount: balanceChange,
          description: expense.name,
          relatedExpenseId: id,
          createdBy: approvedBy,
          createdAt: now,
        };

        // Single set() call to update expense, balance, and history together.
        // This triggers only ONE Zustand persist cycle instead of three,
        // avoiding 3x localStorage serialization of the entire store.
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: "approved" as const,
                  approvedBy,
                  approvedAt: now,
                  updatedAt: now,
                }
              : e
          ),
          tab: state.tab
            ? { ...state.tab, currentBalance: newBalance, updatedAt: now }
            : null,
          history: [historyEntry, ...state.history],
        }));

        // Capture pre-change state for rollback if primary sync fails
        const savedExpenses = get().expenses;
        const savedTab = get().tab;
        const savedHistory = get().history;

        // Sync sequentially: if the expense update fails, rollback local state.
        // Balance and history sync failures are logged but don't roll back
        // (they are idempotent and will be retried on next app load).
        (async () => {
          const expenseResult = await retryWithBackoff(
            () => updateExpense(id, { status: "approved", approvedBy, approvedAt: now, updatedAt: now }),
            3, "approveExpense"
          );

          if (expenseResult === undefined) {
            console.error("[Store] approveExpense: primary sync failed, rolling back local state");
            set({ expenses: savedExpenses, tab: savedTab, history: savedHistory });
            return;
          }

          if (currentTab) {
            await retryWithBackoff(
              () => updateTabBalance(currentTab.id, newBalance), 3, "approveExpense:balance"
            );
          }

          await retryWithBackoff(() => upsertHistory([historyEntry]), 3, "approveExpense:history");
        })();
      },

      approveAllPendingExpenses: (approvedBy) => {
        const pendingExpenses = get().expenses.filter((e) => e.status === "pending");
        if (pendingExpenses.length === 0) return;

        const now = new Date().toISOString();
        const currentTab = get().tab;
        let runningBalance = currentTab?.currentBalance ?? 0;

        // Build all updates in a single pass
        const approvedIds = new Set(pendingExpenses.map((e) => e.id));
        const newHistoryEntries: TabHistoryEntry[] = [];

        for (const expense of pendingExpenses) {
          const isTopUp = expense.name === TOPUP_EXPENSE_NAME;
          const balanceChange = isTopUp ? expense.amount : -expense.amount;
          runningBalance += balanceChange;

          newHistoryEntries.push({
            id: generateId(),
            type: isTopUp ? "add" : "expense_approved",
            amount: balanceChange,
            description: expense.name,
            relatedExpenseId: expense.id,
            createdBy: approvedBy,
            createdAt: now,
          });
        }

        // Single set() call for all approvals — one persist cycle, one re-render
        set((state) => ({
          expenses: state.expenses.map((e) =>
            approvedIds.has(e.id)
              ? {
                  ...e,
                  status: "approved" as const,
                  approvedBy,
                  approvedAt: now,
                  updatedAt: now,
                }
              : e
          ),
          tab: state.tab
            ? { ...state.tab, currentBalance: runningBalance, updatedAt: now }
            : null,
          history: [...newHistoryEntries, ...state.history],
        }));

        // Sync to Supabase with retry: batch where possible
        for (const expense of pendingExpenses) {
          retryWithBackoff(
            () => updateExpense(expense.id, { status: "approved", approvedBy, approvedAt: now, updatedAt: now }),
            3, "approveAllExpenses"
          ).catch((error) => {
            console.error("[Store] Failed to sync expense approval to Supabase after retries:", error);
          });
        }

        if (currentTab) {
          retryWithBackoff(
            () => updateTabBalance(currentTab.id, runningBalance), 3, "approveAllExpenses:balance"
          ).catch((error) => {
            console.error("[Store] Failed to sync tab balance to Supabase after retries:", error);
          });
        }

        retryWithBackoff(() => upsertHistory(newHistoryEntries), 3, "approveAllExpenses:history").catch((error) => {
          console.error("[Store] Failed to sync history entries to Supabase after retries:", error);
        });
      },

      rejectAllPendingExpenses: (reason, rejectedBy) => {
        const pendingExpenses = get().expenses.filter((e) => e.status === "pending");
        if (pendingExpenses.length === 0) return;

        const now = new Date().toISOString();
        const rejectedIds = new Set(pendingExpenses.map((e) => e.id));
        const newHistoryEntries: TabHistoryEntry[] = [];

        for (const expense of pendingExpenses) {
          newHistoryEntries.push({
            id: generateId(),
            type: "expense_rejected",
            amount: 0,
            description: `Rejected: ${expense.name} - ${reason}`,
            relatedExpenseId: expense.id,
            createdBy: rejectedBy,
            createdAt: now,
          });
        }

        // Single set() call for all rejections
        set((state) => ({
          expenses: state.expenses.map((e) =>
            rejectedIds.has(e.id)
              ? {
                  ...e,
                  status: "rejected" as const,
                  approvedBy: rejectedBy,
                  approvedAt: now,
                  rejectionReason: reason,
                  updatedAt: now,
                }
              : e
          ),
          history: [...newHistoryEntries, ...state.history],
        }));

        // Sync to Supabase with retry
        for (const expense of pendingExpenses) {
          retryWithBackoff(
            () => updateExpense(expense.id, { status: "rejected", approvedBy: rejectedBy, approvedAt: now, rejectionReason: reason, updatedAt: now }),
            3, "rejectAllExpenses"
          ).catch((error) => {
            console.error("[Store] Failed to sync expense rejection to Supabase after retries:", error);
          });
        }

        retryWithBackoff(() => upsertHistory(newHistoryEntries), 3, "rejectAllExpenses:history").catch((error) => {
          console.error("[Store] Failed to sync history entries to Supabase after retries:", error);
        });
      },

      rejectExpense: (id, reason, approvedBy) => {
        const expense = get().expenses.find((e) => e.id === id);
        if (!expense || expense.status !== "pending") return;

        const now = new Date().toISOString();
        const historyId = generateId();

        const historyEntry: TabHistoryEntry = {
          id: historyId,
          type: "expense_rejected",
          amount: 0,
          description: `Rejected: ${expense.name} - ${reason}`,
          relatedExpenseId: id,
          createdBy: approvedBy,
          createdAt: now,
        };

        // Single set() call for expense update + history entry
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: "rejected" as const,
                  approvedBy,
                  approvedAt: now,
                  rejectionReason: reason,
                  updatedAt: now,
                }
              : e
          ),
          history: [historyEntry, ...state.history],
        }));

        // Sync all changes to Supabase with retry
        retryWithBackoff(
          () => updateExpense(id, { status: "rejected", approvedBy, approvedAt: now, rejectionReason: reason, updatedAt: now }),
          3, "rejectExpense"
        ).catch((error) => {
          console.error("[Store] Failed to sync expense rejection to Supabase after retries:", error);
        });

        retryWithBackoff(() => upsertHistory([historyEntry]), 3, "rejectExpense:history").catch((error) => {
          console.error("[Store] Failed to sync history entry to Supabase after retries:", error);
        });
      },

      setAttachment: (expenseId, url) => {
        const now = new Date().toISOString();
        let updatedUrls: string[] = [];
        set((state) => ({
          expenses: state.expenses.map((e) => {
            if (e.id !== expenseId) return e;
            updatedUrls = [...e.attachmentUrls, url];
            return { ...e, attachmentUrls: updatedUrls, updatedAt: now };
          }),
        }));

        // Sync to Supabase with retry
        retryWithBackoff(
          () => updateExpense(expenseId, { attachmentUrls: updatedUrls, updatedAt: now }),
          3, "setAttachment"
        ).catch((error) => {
          console.error("[Store] Failed to sync attachment to Supabase after retries:", error);
        });
      },

      deleteExpense: (id) => {
        const expense = get().expenses.find((e) => e.id === id);
        // Only allow deletion of pending or rejected expenses
        if (!expense || expense.status === "approved") return;

        // Clean up attachments from Supabase Storage
        if (expense.attachmentUrls.length > 0) {
          deleteAttachments(expense.attachmentUrls).catch((error) => {
            console.error("[Store] Failed to delete attachment from Storage:", error);
          });
        }

        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }));

        // Sync to Supabase with retry
        retryWithBackoff(() => deleteExpenseFromSupabase(id), 3, "deleteExpense").catch((error) => {
          console.error("[Store] Failed to sync expense deletion to Supabase after retries:", error);
        });
      },

      clearCompletedExpenses: () => {
        // Collect attachment URLs from completed expenses before removing them
        const completedExpenses = get().expenses.filter(
          (e) => e.status === "approved" || e.status === "rejected"
        );
        const attachmentUrls = completedExpenses.flatMap((e) => e.attachmentUrls);

        // Keep only pending expenses, remove approved and rejected
        set((state) => ({
          expenses: state.expenses.filter((e) => e.status === "pending"),
        }));

        // Delete attachments from Supabase Storage
        if (attachmentUrls.length > 0) {
          deleteAttachments(attachmentUrls).catch((error) => {
            console.error("[Store] Failed to delete attachments from Storage:", error);
          });
        }

        // Also delete expenses from Supabase for cross-device sync
        deleteCompletedExpenses().catch((error) => {
          console.error("[Store] Failed to delete completed expenses from Supabase:", error);
        });
      },

      autoCleanExpiredExpenses: () => {
        const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - ONE_MONTH_MS);
        const cutoffISO = cutoff.toISOString();

        const expired = get().expenses.filter(
          (e) =>
            (e.status === "approved" || e.status === "rejected") &&
            e.approvedAt !== null &&
            e.approvedAt < cutoffISO
        );

        if (expired.length === 0) return;

        // Collect attachment URLs before removing
        const attachmentUrls = expired.flatMap((e) => e.attachmentUrls);

        const expiredIds = new Set(expired.map((e) => e.id));

        set((state) => ({
          expenses: state.expenses.filter((e) => !expiredIds.has(e.id)),
        }));

        // Clean up attachments from Supabase Storage
        if (attachmentUrls.length > 0) {
          deleteAttachments(attachmentUrls).catch((error) => {
            console.error("[Store] Failed to delete expired attachments:", error);
          });
        }

        // Delete from Supabase DB
        deleteExpiredCompletedExpenses(cutoffISO).catch((error) => {
          console.error("[Store] Failed to delete expired expenses from Supabase:", error);
        });
      },

      getTabBalance: () => {
        return get().tab?.currentBalance ?? 0;
      },

      getPendingExpenses: () => {
        return get().expenses.filter((e) => e.status === "pending");
      },

      getApprovedExpenses: () => {
        return get().expenses.filter((e) => e.status === "approved");
      },

      getRejectedExpenses: () => {
        return get().expenses.filter((e) => e.status === "rejected");
      },
    }),
    {
      name: RUNNING_TAB_STORAGE_KEY,
      // Exclude history from localStorage persistence to prevent unbounded
      // storage growth. History is fetched from Supabase on every app load
      // via performInitialLoad(), so persisting it locally is redundant and
      // becomes the largest contributor to localStorage bloat over time.
      partialize: (state) => ({
        tab: state.tab,
        expenses: state.expenses,
        // history is intentionally excluded — loaded from cloud on startup
        // searchedHistory IS persisted — user-initiated searches survive refresh,
        // managed via per-month delete buttons to control localStorage size
        searchedHistory: state.searchedHistory,
      }),
    }
  )
);
