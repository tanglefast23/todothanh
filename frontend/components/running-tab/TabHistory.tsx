"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, History, Search, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
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
    <section className="flex flex-col gap-3.5">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        className="flex items-center justify-between w-full text-left group"
        aria-expanded={isSectionExpanded}
        aria-controls="balance-history-content"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#FFF7ED]">
            <History className="size-5 text-orange-500" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[15px] font-bold tracking-tight text-foreground">Balance History</h3>
            <p className="text-xs text-[#9CA3AF]">Audit log of all balance changes</p>
          </div>
        </div>
        <ChevronUp
          className={cn(
            "size-5 text-[#9CA3AF] transition-transform duration-300",
            !isSectionExpanded && "rotate-180"
          )}
        />
      </button>

      {isSectionExpanded && (
        <div id="balance-history-content" className="flex flex-col gap-2.5 animate-fade-in-up">
          {monthGroups.map((group, index) => (
            <BalanceMonthGroup
              key={group.key}
              group={group}
              isOpen={expandedMonths.has(group.key)}
              ownerMap={ownerMap}
              onToggle={toggleMonth}
              isCurrentMonth={index === 0}
            />
          ))}
        </div>
      )}
    </section>
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
  isCurrentMonth,
}: {
  group: MonthGroup;
  isOpen: boolean;
  ownerMap: Map<string, string>;
  onToggle: (key: string) => void;
  isCurrentMonth: boolean;
}) {
  const enrichedEntries = useMemo(
    () =>
      group.entries.map((entry) => ({
        ...entry,
        creatorName: entry.createdBy ? ownerMap.get(entry.createdBy) : undefined,
      })),
    [group.entries, ownerMap],
  );

  return (
    <div
      className={cn(
        "rounded-[18px] border-[1.5px] bg-white overflow-hidden",
        isCurrentMonth ? "border-[#FDBA74]" : "border-[#E5E7EB]",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(group.key)}
        className="flex flex-col gap-1.5 w-full px-4 py-3.5 text-left transition-colors active:bg-[#F6F7F8]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1A1A1A]">
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[#9CA3AF] transition-transform duration-200",
              !isOpen && "-rotate-90"
            )}
          />
          {group.label}
          <span className="text-xs text-[#9CA3AF] font-normal">
            ({group.entries.length} {group.entries.length === 1 ? "entry" : "entries"})
          </span>
        </div>
        <div className="flex items-center gap-4 ml-6 text-xs">
          <span className="text-emerald-500 font-semibold">
            +{formatVND(group.stats.totalAdded)}
          </span>
          <span className="text-red-500 font-semibold">
            -{formatVND(group.stats.totalApproved)}
          </span>
          {group.stats.totalRejected > 0 && (
            <span className="text-[#9CA3AF]">
              ({formatVND(group.stats.totalRejected)} rejected)
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-[#E5E7EB] animate-fade-in-up">
          <div className="flex flex-col gap-0 pt-1">
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
// Section 2: Search History
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
    <section className="flex flex-col gap-3.5">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsSectionExpanded(!isSectionExpanded)}
        className="flex items-center justify-between w-full text-left group"
        aria-expanded={isSectionExpanded}
        aria-controls="search-history-content"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#F0F5FF]">
            <Search className="size-5 text-indigo-500" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[15px] font-bold tracking-tight text-foreground">Search History</h3>
            <p className="text-xs text-[#9CA3AF]">Load any past month from the cloud</p>
          </div>
        </div>
        <ChevronUp
          className={cn(
            "size-5 text-[#9CA3AF] transition-transform duration-300",
            !isSectionExpanded && "rotate-180"
          )}
        />
      </button>

      {isSectionExpanded && (
        <div id="search-history-content" className="flex flex-col gap-3.5 animate-fade-in-up">
          {/* Month/Year picker + Search button */}
          <div className="flex items-center gap-2.5">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger size="sm" className="flex-1 h-10 rounded-xl border-[1.5px] border-[#E5E7EB] bg-white text-sm font-medium">
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
              <SelectTrigger size="sm" className="w-[100px] h-10 rounded-xl border-[1.5px] border-[#E5E7EB] bg-white text-sm font-medium">
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

            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-[#F97316] text-white text-sm font-semibold transition-transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Search className="size-4" />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          {/* Searched month groups */}
          {sortedMonthKeys.length > 0 && (
            <div className="flex flex-col gap-2.5">
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
        </div>
      )}
    </section>
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
    <div className="rounded-[18px] border-[1.5px] border-[#E5E7EB] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => onToggle(monthKey)}
          className="flex items-center gap-2 text-[14px] font-semibold text-[#1A1A1A] transition-colors"
        >
          <ChevronDown
            className={cn(
              "size-4 text-[#9CA3AF] transition-transform duration-200",
              !isOpen && "-rotate-90"
            )}
          />
          {label}
          <span className="text-xs text-[#9CA3AF] font-normal">
            ({entries.length} {entries.length === 1 ? "entry" : "entries"})
          </span>
        </button>
        <button
          onClick={() => onRemove(monthKey)}
          className="flex size-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Remove this month from memory"
        >
          <X className="size-4" />
        </button>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-[#E5E7EB]">
          {entries.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] py-4 text-center">
              No history entries found for this month
            </p>
          ) : (
            <div className="flex flex-col gap-0 pt-1">
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
    <div className="flex items-start justify-between py-3 border-b border-[#F3F4F6] last:border-0">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-[13px] font-semibold", config.colorClass)}>
            {config.label}
          </span>
        </div>
        {entry.description && (
          <p className="text-[13px] text-[#6B7280]">{entry.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          {entry.creatorName && (
            <span className="font-medium text-[#6B7280]">{entry.creatorName}</span>
          )}
          <span>{formatDateTime(entry.createdAt)}</span>
        </div>
      </div>
      <span
        className={cn(
          "font-mono text-sm font-bold tabular-nums shrink-0",
          isNeutral
            ? "text-[#9CA3AF]"
            : isPositive
              ? "text-emerald-500"
              : "text-red-500"
        )}
      >
        {isPositive ? "+" : ""}
        {formatVND(entry.amount)}
      </span>
    </div>
  );
}
