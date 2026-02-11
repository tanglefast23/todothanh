"use client";

import { useState, useRef, useEffect, useImperativeHandle, useCallback, forwardRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddExpenseModalProps {
  onAddExpense: (name: string, amount: number) => void;
  onAddBulkExpenses: (entries: { name: string; amount: number }[]) => void;
  prefilledName?: string;
  prefilledTab?: "simple" | "bulk";
  onClearPrefilled?: () => void;
}

export interface AddExpenseModalHandle {
  openWithTab: (tab: string) => void;
}

export const AddExpenseModal = forwardRef<AddExpenseModalHandle, AddExpenseModalProps>(function AddExpenseModal({
  onAddExpense,
  onAddBulkExpenses,
  prefilledName,
  prefilledTab = "simple",
  onClearPrefilled,
}, ref) {
  type FocusTarget = "name" | "amount" | "bulk";

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("simple");

  // Refs for keyboard navigation
  const nameInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const bulkTextareaRef = useRef<HTMLTextAreaElement>(null);
  const preferredFocusRef = useRef<FocusTarget>("name");
  const tabLockRef = useRef<string | null>(null);
  const tabLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simple form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  // Bulk form state
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkKeyboardMode, setBulkKeyboardMode] = useState<"text" | "numeric">("text");

  const resetForm = () => {
    setName("");
    setAmount("");
    setBulkText("");
    setBulkError(null);
    setBulkKeyboardMode("text");
    setActiveTab("simple");
  };

  const focusField = useCallback((target: FocusTarget) => {
    const element =
      target === "name"
        ? nameInputRef.current
        : target === "amount"
          ? amountInputRef.current
          : bulkTextareaRef.current;

    if (!element) return;

    element.focus({ preventScroll: true });

    if (target === "name" && element instanceof HTMLInputElement) {
      // Desktop: highlight existing text. Mobile: caret is ready and keyboard opens.
      element.select();
      return;
    }

    if (target === "amount" && element instanceof HTMLInputElement) {
      const cursor = element.value.length;
      element.setSelectionRange(cursor, cursor);
      return;
    }

    if (target === "bulk" && element instanceof HTMLTextAreaElement) {
      const cursor = element.value.length;
      element.setSelectionRange(cursor, cursor);
    }
  }, []);

  const queueFocusField = useCallback((target: FocusTarget) => {
    preferredFocusRef.current = target;
    requestAnimationFrame(() => {
      focusField(target);
    });
  }, [focusField]);

  const lockTabSelection = (tab: string) => {
    tabLockRef.current = tab;
    if (tabLockTimerRef.current) {
      clearTimeout(tabLockTimerRef.current);
    }
    tabLockTimerRef.current = setTimeout(() => {
      tabLockRef.current = null;
      tabLockTimerRef.current = null;
    }, 350);
  };

  // Handle prefilled name from shortcuts
  useEffect(() => {
    if (prefilledName) {
      const shortcutTab = prefilledTab === "bulk" ? "bulk" : "simple";
      lockTabSelection(shortcutTab);
      setName(prefilledName);
      setActiveTab(shortcutTab);

      if (shortcutTab === "bulk") {
        setBulkText(`${prefilledName} `);
        setBulkError(null);
        setBulkKeyboardMode("numeric");
        preferredFocusRef.current = "bulk";
      } else {
        setBulkKeyboardMode("text");
        preferredFocusRef.current = "amount";
      }

      if (!open) {
        setOpen(true);
      } else {
        queueFocusField(preferredFocusRef.current);
      }
    }
  }, [open, prefilledName, prefilledTab, queueFocusField]);

  useEffect(() => {
    return () => {
      if (tabLockTimerRef.current) {
        clearTimeout(tabLockTimerRef.current);
      }
    };
  }, []);

  const handleSimpleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (name.trim() && numAmount > 0) {
      onAddExpense(name.trim(), numAmount);
      onClearPrefilled?.();
      resetForm();
      setOpen(false);
    }
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);

    try {
      const entries = parseBulkInput(bulkText);
      if (entries.length === 0) {
        setBulkError("No valid entries found. Use format: name amount, name amount, ...");
        return;
      }
      onAddBulkExpenses(entries);
      onClearPrefilled?.();
      resetForm();
      setOpen(false);
    } catch (error) {
      setBulkError(
        error instanceof Error ? error.message : "Failed to parse bulk input"
      );
    }
  };

  // Format amount input as user types
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value) {
      const num = parseInt(value, 10);
      setAmount(num.toLocaleString("vi-VN"));
    } else {
      setAmount("");
    }
  };

  // Handle Enter key on name field - move to amount field
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      focusField("amount");
    }
  };

  // Handle Enter key on amount field - submit the form
  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const numAmount = parseInt(amount.replace(/[^0-9]/g, ""), 10);
      if (name.trim() && numAmount > 0) {
        onAddExpense(name.trim(), numAmount);
        onClearPrefilled?.();
        resetForm();
        setOpen(false);
      }
    }
  };

  // Focus name input when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      tabLockRef.current = null;
      if (tabLockTimerRef.current) {
        clearTimeout(tabLockTimerRef.current);
        tabLockTimerRef.current = null;
      }
      // Clear prefilled name when modal closes
      if (onClearPrefilled) {
        onClearPrefilled();
      }
      resetForm();
    }
  };

  // Handle tab change - focus appropriate input
  const handleTabChange = (tab: string) => {
    if (tabLockRef.current && tab !== tabLockRef.current) {
      return;
    }
    setBulkKeyboardMode("text");
    setActiveTab(tab);
    if (tab === "simple") {
      queueFocusField("name");
    } else {
      queueFocusField("bulk");
    }
  };

  // Handle Enter key on bulk textarea - submit form
  const handleBulkKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const entries = parseBulkInputSafe(bulkText);
      if (entries.length > 0) {
        onAddBulkExpenses(entries);
        onClearPrefilled?.();
        resetForm();
        setOpen(false);
      }
    }
  };

  // Open modal with a specific tab
  const openWithTab = (tab: string) => {
    onClearPrefilled?.();
    lockTabSelection(tab);
    setBulkKeyboardMode("text");
    setActiveTab(tab);
    preferredFocusRef.current = tab === "simple" ? "name" : "bulk";
    if (open) {
      queueFocusField(preferredFocusRef.current);
    } else {
      setOpen(true);
    }
  };

  // Expose openWithTab via ref
  useImperativeHandle(ref, () => ({ openWithTab }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Action buttons — matches Pencil MCP redesign (rendered via renderButtons) */}
      <div className="contents" />
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const target = preferredFocusRef.current;
          // Attempt focus immediately, then retry after a frame and a short
          // delay. On mobile, the keyboard is already open via the proxy input;
          // these calls transfer focus to the real field so it stays open.
          focusField(target);
          requestAnimationFrame(() => focusField(target));
          setTimeout(() => focusField(target), 50);
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Add a new expense to the running tab. It will need approval before
            being deducted.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="bulk">Bulk</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="mt-4">
            <form onSubmit={handleSimpleSubmit} className="space-y-4">
              <div>
                <label htmlFor="expense-name" className="text-sm font-medium">Expense Name</label>
                <Input
                  id="expense-name"
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  placeholder="e.g., Coffee, Lunch, Groceries"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="expense-amount" className="text-sm font-medium">Amount (VND)</label>
                <Input
                  id="expense-amount"
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  enterKeyHint="done"
                  value={amount}
                  onChange={handleAmountChange}
                  onKeyDown={handleAmountKeyDown}
                  placeholder="50,000"
                  className="mt-1"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!name.trim() || !amount}>
                  Add Expense
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4">
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label htmlFor="bulk-entry" className="text-sm font-medium">Bulk Entry</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Format: name amount, name amount, ...
                </p>
                <textarea
                  id="bulk-entry"
                  ref={bulkTextareaRef}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  onKeyDown={handleBulkKeyDown}
                  inputMode={bulkKeyboardMode}
                  placeholder="coffee 50000, lunch 120000, snacks 30000"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                {bulkError && (
                  <p className="text-sm text-destructive mt-1">{bulkError}</p>
                )}
              </div>
              <BulkPreview text={bulkText} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!bulkText.trim()}>
                  Add All
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

/**
 * Parse bulk input text into expense entries.
 * Smart format: "name amount, name amount, ..."
 * The amount is detected as the first number sequence in each item.
 * Examples:
 *   "coffee 50000, lunch 100000" → 2 items
 *   "coffee50000, lunch100000" → 2 items (no space needed)
 *   "gas station 75000" → name: "gas station", amount: 75000
 */
function parseBulkInput(text: string): { name: string; amount: number }[] {
  // Normalize: replace newlines with commas, then split by comma
  const normalized = text.replace(/\n/g, ",");
  const items = normalized.split(",").map((p) => p.trim()).filter(Boolean);

  const entries: { name: string; amount: number }[] = [];

  for (const item of items) {
    // Find where the number starts (the amount)
    // Match: any text followed by a number sequence at the end
    const match = item.match(/^(.+?)[\s]*(\d[\d\s.,]*)$/);

    if (match) {
      const name = match[1].trim();
      // Remove any non-numeric characters from the amount (spaces, dots, commas)
      const amountStr = match[2].replace(/[^0-9]/g, "");
      const amount = parseInt(amountStr, 10);

      if (name && amount > 0) {
        entries.push({ name, amount });
      }
    }
  }

  return entries;
}

/**
 * Preview component showing parsed bulk entries
 */
function BulkPreview({ text }: { text: string }) {
  if (!text.trim()) return null;

  // Parse outside of JSX to avoid try/catch lint issues
  const entries = parseBulkInputSafe(text);
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="rounded-md border bg-muted/50 p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Preview ({entries.length} items)
      </p>
      <ul className="space-y-1 text-sm">
        {entries.slice(0, 5).map((entry, idx) => (
          <li key={idx} className="flex justify-between">
            <span>{entry.name}</span>
            <span className="font-mono">
              {entry.amount.toLocaleString("vi-VN")}
            </span>
          </li>
        ))}
        {entries.length > 5 && (
          <li className="text-muted-foreground">
            ...and {entries.length - 5} more
          </li>
        )}
      </ul>
      <div className="mt-2 pt-2 border-t flex justify-between font-medium">
        <span>Total</span>
        <span className="font-mono">{total.toLocaleString("vi-VN")} VND</span>
      </div>
    </div>
  );
}

/**
 * Safe version of parseBulkInput that returns empty array on error
 */
function parseBulkInputSafe(text: string): { name: string; amount: number }[] {
  try {
    return parseBulkInput(text);
  } catch {
    return [];
  }
}
