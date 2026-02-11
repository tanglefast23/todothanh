"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight, History, Search, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatVND } from "./BalanceDisplay";
import { formatDateTime } from "@/lib/formatters";
import { fetchTabHistoryByMonth } from "@/lib/supabase/queries/tabHistory";
import { useRunningTabStore } from "@/stores/runningTabStore";
import type { TabHistoryEntry, TabHistoryType } from "@/types/runningTab";

interface TabHistoryProps {
  history: TabHistoryEntry[];
  owners: { id: string; name: string }[];
}

const historyTypeConfig: Record<
  TabHistoryType,
  { label: string; colorClass: string }
> = {
  initial: { label: "Initial Balance", colorClass: "text-blue-500" },
  add: { label: "Balance Added", colorClass: "text-green-500" },
  expense_approved: { label: "Expense Approved", colorClass: "text-red-500" },
  expense_rejected: { label: "Expense Rejected", colorClass: "text-muted-foreground" },
  adjustment: { label: "Balance Adjustment", colorClass: "text-amber-500" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ---------------------------------------------------------------------------
// Monthly grouping helper
// ---------------------------------------------------------------------------

interface MonthGroup {
  key: string;
  label: string;
  entries: TabHistoryEntry[];
  stats: {
    totalAdded: number;
    totalApproved: number;
    totalRejected: number;
  };
}

function groupEntriesByMonth(entries: TabHistoryEntry[]): MonthGroup[] {
  const buckets = new Map<string, { entries: TabHistoryEntry[]; totalAdded: number; totalApproved: number; totalRejected: number }>();

  for (const entry of entries) {
    if (!entry.createdAt) continue;
    const date = new Date(entry.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { entries: [], totalAdded: 0, totalApproved: 0, totalRejected: 0 };
      buckets.set(key, bucket);
    }

    bucket.entries.push(entry);

    if (entry.type === "add") {
      bucket.totalAdded += entry.amount;
    } else if (entry.type === "expense_approved") {
      bucket.totalApproved += Math.abs(entry.amount);
    } else if (entry.type === "expense_rejected") {
      bucket.totalRejected += Math.abs(entry.amount);
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, bucket]) => {
      const [yearStr, monthStr] = key.split("-");
      return {
        key,
        label: format(
          new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1),
          "MMMM yyyy",
        ),
        entries: bucket.entries,
        stats: {
          totalAdded: bucket.totalAdded,
          totalApproved: bucket.totalApproved,
          totalRejected: bucket.totalRejected,
        },
      };
    });
}

export function TabHistory({ history, owners }: TabHistoryProps) {
  return (
    <>
      <BalanceHistorySection history={history} owners={owners} />
      <SearchHistorySection owners={owners} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Balance History (grouped by month)
// ---------------------------------------------------------------------------

function BalanceHistorySection({
  history,
  owners,
}: {
  history: TabHistoryEntry[];
  owners: { id: string; name: string }[];
}) {
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const monthGroups = useMemo(() => groupEntriesByMonth(history), [history]);

  const ownerMap = useMemo(
    () => new Map(owners.map((o) => [o.id, o.name])),
    [owners],
  );

  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
          className="flex items-center justify-between w-full text-left"
          aria-expanded={isSectionExpanded}
          aria-controls="balance-history-content"
        >
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Balance History</CardTitle>
          </div>
          {isSectionExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <CardDescription>
          Audit log of all balance changes (last 6 months)
        </CardDescription>
      </CardHeader>

      {isSectionExpanded && (
        <CardContent id="balance-history-content" className="space-y-2">
          {monthGroups.map((group) => (
            <BalanceMonthGroup
              key={group.key}
              group={group}
              isOpen={expandedMonths.has(group.key)}
              ownerMap={ownerMap}
              onToggle={toggleMonth}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Balance month collapsible group
// ---------------------------------------------------------------------------

function BalanceMonthGroup({
  group,
  isOpen,
  ownerMap,
  onToggle,
}: {
  group: MonthGroup;
  isOpen: boolean;
  ownerMap: Map<string, string>;
  onToggle: (key: string) => void;
}) {
  const enrichedEntries = useMemo(
    () =>
      group.entries.map((entry) => ({
        ...entry,
        creatorName: entry.createdBy ? ownerMap.get(entry.createdBy) : undefined,
      })),
    [group.entries, ownerMap],
  );

  const contentId = `balance-month-${group.key}`;

  return (
    <div className="border rounded-md">
      <button
        type="button"
        onClick={() => onToggle(group.key)}
        className="flex flex-col gap-1 w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          {group.label}
          <span className="text-xs text-muted-foreground font-normal">
            ({group.entries.length} {group.entries.length === 1 ? "entry" : "entries"})
          </span>
        </div>
        <div className="flex items-center gap-3 ml-6 text-xs flex-wrap">
          <span className="text-green-500">
            Added: {formatVND(group.stats.totalAdded)}
          </span>
          <span className="text-red-500">
            Approved: {formatVND(group.stats.totalApproved)}
          </span>
          <span className="text-muted-foreground">
            Rejected: {formatVND(group.stats.totalRejected)}
          </span>
        </div>
      </button>

      {isOpen && (
        <div id={contentId} className="px-3 pb-3 border-t">
          <div className="space-y-3 pt-2">
            {enrichedEntries.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Search History (new)
// ---------------------------------------------------------------------------

function SearchHistorySection({
  owners,
}: {
  owners: { id: string; name: string }[];
}) {
  const [currentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth.month));
  const [selectedYear, setSelectedYear] = useState(String(currentMonth.year));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const searchedHistory = useRunningTabStore((s) => s.searchedHistory);
  const setSearchedMonth = useRunningTabStore((s) => s.setSearchedMonth);
  const removeSearchedMonth = useRunningTabStore((s) => s.removeSearchedMonth);

  // Build year options: current year back to 5 years ago
  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, i) => String(currentMonth.year - i)),
    [currentMonth.year],
  );

  const handleSearch = useCallback(async () => {
    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonth, 10);
    const key = `${year}-${String(month).padStart(2, "0")}`;

    setIsLoading(true);
    setError(null);

    try {
      const entries = await fetchTabHistoryByMonth(year, month);
      setSearchedMonth(key, entries);
      // Auto-expand the newly searched month
      setExpandedMonths((prev) => new Set(prev).add(key));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch history");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, setSearchedMonth]);

  const handleRemoveMonth = useCallback(
    (key: string) => {
      removeSearchedMonth(key);
      setExpandedMonths((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
    [removeSearchedMonth],
  );

  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Sort searched months descending (newest first)
  const sortedMonthKeys = useMemo(
    () => Object.keys(searchedHistory).sort((a, b) => b.localeCompare(a)),
    [searchedHistory],
  );

  const ownerMap = useMemo(
    () => new Map(owners.map((o) => [o.id, o.name])),
    [owners],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
          className="flex items-center justify-between w-full text-left"
          aria-expanded={isSectionExpanded}
          aria-controls="search-history-content"
        >
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Search History</CardTitle>
          </div>
          {isSectionExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <CardDescription>
          Load any past month from the cloud on demand
        </CardDescription>
      </CardHeader>

      {isSectionExpanded && (
        <CardContent id="search-history-content" className="space-y-4">
          {/* Month/Year picker + Search button */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger size="sm" className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              onClick={handleSearch}
              disabled={isLoading}
              className="h-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Searched month groups */}
          {sortedMonthKeys.length > 0 && (
            <div className="space-y-2">
              {sortedMonthKeys.map((key) => {
                const entries = searchedHistory[key];
                const isOpen = expandedMonths.has(key);
                const [yearStr, monthStr] = key.split("-");
                const label = format(
                  new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1),
                  "MMMM yyyy",
                );

                return (
                  <SearchedMonthGroup
                    key={key}
                    monthKey={key}
                    label={label}
                    entries={entries}
                    isOpen={isOpen}
                    ownerMap={ownerMap}
                    onToggle={toggleMonth}
                    onRemove={handleRemoveMonth}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Searched month collapsible group
// ---------------------------------------------------------------------------

function SearchedMonthGroup({
  monthKey,
  label,
  entries,
  isOpen,
  ownerMap,
  onToggle,
  onRemove,
}: {
  monthKey: string;
  label: string;
  entries: TabHistoryEntry[];
  isOpen: boolean;
  ownerMap: Map<string, string>;
  onToggle: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  const enrichedEntries = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        creatorName: entry.createdBy ? ownerMap.get(entry.createdBy) : undefined,
      })),
    [entries, ownerMap]
  );

  return (
    <div className="border rounded-md">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => onToggle(monthKey)}
          className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {label}
          <span className="text-xs text-muted-foreground font-normal">
            ({entries.length} {entries.length === 1 ? "entry" : "entries"})
          </span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(monthKey)}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          title="Remove this month from memory"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="px-3 pb-3 border-t">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No history entries found for this month
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              {enrichedEntries.map((entry) => (
                <HistoryItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared HistoryItem (reused by both sections)
// ---------------------------------------------------------------------------

interface HistoryItemProps {
  entry: TabHistoryEntry & { creatorName?: string };
}

function HistoryItem({ entry }: HistoryItemProps) {
  const config = historyTypeConfig[entry.type];
  const isPositive = entry.amount > 0;
  const isNeutral = entry.amount === 0;

  return (
    <div className="flex items-start justify-between py-2 border-b last:border-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", config.colorClass)}>
            {config.label}
          </span>
        </div>
        {entry.description && (
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry.creatorName && (
            <span>
              By <span className="font-medium">{entry.creatorName}</span>
            </span>
          )}
          <span>{formatDateTime(entry.createdAt)}</span>
        </div>
      </div>
      <div
        className={cn(
          "font-mono text-sm font-medium",
          isNeutral
            ? "text-muted-foreground"
            : isPositive
              ? "text-green-500"
              : "text-red-500"
        )}
      >
        {isPositive ? "+" : ""}
        {formatVND(entry.amount)}
      </div>
    </div>
  );
}
