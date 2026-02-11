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

/** Number of history entries to show per page in the UI */
const HISTORY_DISPLAY_PAGE_SIZE = 50;

export function TabHistory({ history, owners }: TabHistoryProps) {
  return (
    <>
      <BalanceHistorySection history={history} owners={owners} />
      <SearchHistorySection owners={owners} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Balance History (existing behavior, unchanged)
// ---------------------------------------------------------------------------

function BalanceHistorySection({
  history,
  owners,
}: {
  history: TabHistoryEntry[];
  owners: { id: string; name: string }[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayCount, setDisplayCount] = useState(HISTORY_DISPLAY_PAGE_SIZE);

  const enrichedHistory = useMemo(() => {
    const ownerMap = new Map(owners.map((o) => [o.id, o.name]));
    return history.slice(0, displayCount).map((entry) => ({
      ...entry,
      creatorName: entry.createdBy ? ownerMap.get(entry.createdBy) : undefined,
    }));
  }, [history, owners, displayCount]);

  const hasMore = history.length > displayCount;

  if (history.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Balance History</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (isExpanded) setDisplayCount(HISTORY_DISPLAY_PAGE_SIZE);
            }}
            className="h-8"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 mr-1" />
                Show ({history.length})
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Audit log of all balance changes (last 6 months)
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-3">
            {enrichedHistory.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisplayCount((c) => c + HISTORY_DISPLAY_PAGE_SIZE)}
                  className="text-muted-foreground"
                >
                  Load more ({history.length - displayCount} remaining)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
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
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const searchedHistory = useRunningTabStore((s) => s.searchedHistory);
  const setSearchedMonth = useRunningTabStore((s) => s.setSearchedMonth);
  const removeSearchedMonth = useRunningTabStore((s) => s.removeSearchedMonth);

  // Build year options: current year back to 5 years ago
  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 6 }, (_, i) => String(currentYear - i));
  }, [now]);

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
    [removeSearchedMonth]
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
    [searchedHistory]
  );

  const ownerMap = useMemo(
    () => new Map(owners.map((o) => [o.id, o.name])),
    [owners]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Search History</CardTitle>
        </div>
        <CardDescription>
          Load any past month from the cloud on demand
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
                "MMMM yyyy"
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
