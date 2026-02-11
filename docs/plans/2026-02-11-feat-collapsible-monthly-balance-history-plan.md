---
title: "feat: Collapsible Monthly Groups in Balance History + Collapsible Search Section"
type: feat
date: 2026-02-11
---

# Collapsible Monthly Groups in Balance History + Collapsible Search Section

## Overview

Two UI improvements to the Balance History tab (`TabHistory.tsx`):

1. **Balance History** — Group entries by month with collapsible sections. Each month header shows inline quick stats: totals for Balance Added, Expenses Approved, and Expenses Rejected.
2. **Search History** — Make the entire section collapsible so the month/year picker isn't immediately visible.

## Problem Statement / Motivation

The Balance History section currently renders a flat chronological list of entries with manual "Load more" pagination. As history grows, it becomes hard to scan and find relevant periods. Monthly grouping with summary stats lets users quickly understand spending patterns at a glance without scrolling through individual entries.

The Search History section always shows its month/year picker controls, consuming vertical space even when not in use. Collapsing it by default reduces visual clutter.

## Proposed Solution

### Change 1: Monthly Grouping in BalanceHistorySection

**Replace the flat list with month-grouped collapsible sections.**

Current flow:
```
Card → flat list of entries → "Load more" button
```

New flow:
```
Card → MonthGroup[] (each collapsible)
  → MonthGroupHeader (chevron + "January 2026" + entry count + inline stats)
  → MonthGroupContent (list of HistoryItem entries)
```

**Grouping logic:**
- Group by month using `new Date(entry.createdAt).getFullYear()` + `getMonth()` (user's local timezone, consistent with existing `formatDateTime`)
- Sort groups descending (newest month first)
- Sort entries within each group by `createdAt` descending (newest first — same as current behavior)

**Default expansion state:**
- Current month: **expanded**
- All older months: **collapsed**
- State lives in `useState<Set<string>>` (same pattern as existing `SearchHistorySection.expandedMonths`)

**Inline stats per month header:**
- **Balance Added**: `Σ amount` where `type === 'add'` (green)
- **Expenses Approved**: `Σ |amount|` where `type === 'expense_approved'` (red, show as positive)
- **Expenses Rejected**: `Σ |amount|` where `type === 'expense_rejected'` (muted, show as positive)
- If a stat is `0` for a month, still show it as `₫0` (keeps layout consistent)
- Use existing `formatVND()` for all amounts

**Month label format:** `"MMMM yyyy"` via `date-fns format()` (matches existing `SearchedMonthGroup`)

### Change 2: Collapsible Search History Section

**Wrap `SearchHistorySection` card content in a collapsible.**

- Add chevron toggle to the card header (beside the Search icon + title)
- Default to **collapsed**
- When expanded, shows the existing month/year picker + search results
- `CardDescription` remains visible when collapsed (provides context)

### What stays the same

- `HistoryItem` component — **no changes** (reused as-is)
- `SearchedMonthGroup` component — **no changes** (already collapsible)
- Zustand store — **no changes** (data shape unchanged)
- Supabase queries — **no changes** (no new API calls needed)
- `historyTypeConfig` — **no changes**

## Technical Approach

### File: `components/running-tab/TabHistory.tsx`

This is the **only file that changes**. All modifications are contained within this single component file.

#### New helper: `groupEntriesByMonth`

```typescript
// Group entries by "YYYY-MM" key, sorted descending
interface MonthGroup {
  key: string;             // "2026-02"
  label: string;           // "February 2026"
  entries: TabHistoryEntry[];
  stats: {
    totalAdded: number;        // sum of amount where type === 'add'
    totalApproved: number;     // sum of |amount| where type === 'expense_approved'
    totalRejected: number;     // sum of |amount| where type === 'expense_rejected'
  };
}

function groupEntriesByMonth(entries: TabHistoryEntry[]): MonthGroup[] {
  // 1. Bucket entries by YYYY-MM from createdAt (local timezone)
  // 2. For each bucket, compute stats
  // 3. Sort keys descending
  // 4. Return MonthGroup[]
}
```

#### Updated: `BalanceHistorySection`

Replace the flat list rendering with:

```tsx
function BalanceHistorySection({ history, owners }: { ... }) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    // Initialize with current month key expanded
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return new Set([currentKey]);
  });

  const monthGroups = useMemo(() => groupEntriesByMonth(history), [history]);
  const ownerMap = useMemo(() => new Map(owners.map((o) => [o.id, o.name])), [owners]);

  // toggleMonth callback (same pattern as SearchHistorySection)

  return (
    <Card>
      <CardHeader>...</CardHeader>
      <CardContent>
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
    </Card>
  );
}
```

**Pagination removal:** The current "Load more" button (50 entries at a time) is no longer needed. The collapsible month groups naturally paginate content — users only see entries for months they've expanded. With ~6 months of data (the Supabase query limit), each month will have a manageable number of entries. If a single month has >100 entries, we can add per-group pagination later, but this is unlikely given the app's usage pattern.

#### New: `BalanceMonthGroup` component

```tsx
function BalanceMonthGroup({ group, isOpen, ownerMap, onToggle }: {
  group: MonthGroup;
  isOpen: boolean;
  ownerMap: Map<string, string>;
  onToggle: (key: string) => void;
}) {
  // Renders:
  // - Clickable header row with chevron + month label + entry count + stats
  // - Collapsible content with enriched HistoryItem list
  // - ARIA: aria-expanded on button, aria-controls on content region
}
```

**Month header layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ ▸ February 2026 (12 entries)                                │
│   Added: ₫500,000  Approved: ₫300,000  Rejected: ₫50,000   │
└─────────────────────────────────────────────────────────────┘
```

- Chevron + month label + count on the first line
- Stats on a second line below, using smaller text (`text-xs`) with color-coded labels matching `historyTypeConfig` colors (green for added, red for approved, muted for rejected)
- On mobile, stats wrap naturally with `flex-wrap`

#### Updated: `SearchHistorySection`

Minimal change — add a collapsible wrapper around `CardContent`:

```tsx
function SearchHistorySection({ owners }: { ... }) {
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  // ... existing state

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
          className="flex items-center justify-between w-full"
          aria-expanded={isSectionExpanded}
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
        <CardContent className="space-y-4">
          {/* existing month/year picker + search results — unchanged */}
        </CardContent>
      )}
    </Card>
  );
}
```

### Removed: `isExpanded` + "Show/Hide" button

The current `BalanceHistorySection` has a single toggle to show/hide the entire flat list. This is replaced by per-month collapsibles. The card header simplifies to just the title + description (no show/hide button needed since months are individually collapsible).

## Acceptance Criteria

### Functional

- [x] Balance History entries are grouped by month (local timezone)
- [x] Each month group has a collapsible header with chevron icon
- [x] Current month is expanded by default; older months are collapsed
- [x] Each month header shows: month label, entry count, and inline stats
- [x] Stats show: total Balance Added (green), total Expenses Approved (red), total Expenses Rejected (muted)
- [x] Stats use `formatVND()` for currency formatting
- [x] Clicking a month header toggles expand/collapse
- [x] Search History section defaults to collapsed
- [x] Clicking Search History header toggles the section open/closed
- [x] When Search History is expanded, all existing functionality works unchanged

### Accessibility

- [x] Collapsible headers have `aria-expanded` attribute
- [x] Headers are keyboard-accessible (`button` element or `role="button"`)
- [x] Enter/Space toggles expand/collapse on focused headers

### Non-Functional

- [x] `groupEntriesByMonth` is wrapped in `useMemo` (recalculates only when `history` changes)
- [x] Stats computed inside `groupEntriesByMonth` (single pass over entries, not per-render)
- [x] No new dependencies added
- [x] No Zustand store changes
- [x] No API/query changes

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Month with 0 entries of a stat type | Show `₫0` for that stat |
| No history entries at all | Render nothing (existing early return) |
| Entry with null `createdAt` | Skip during grouping (shouldn't happen, but guard) |
| Single entry in a month | Shows "1 entry" (singular) |
| Very long month (100+ entries) | All render when expanded; acceptable since only 1 month expanded at a time typically |
| New month boundary (e.g., Feb → Mar) | New month appears at top; previous month collapses to default |

## Dependencies & Risks

**Low risk.** This is a purely presentational change to a single component file:
- No store changes → no risk of breaking data flow
- No API changes → no backend coordination needed
- Reuses `HistoryItem` unchanged → no regression in entry rendering
- Pattern already proven in `SearchedMonthGroup` and `ExpenseList.tsx`

**Only risk:** If the `history` prop is sorted differently than expected (not by `createdAt` DESC), the grouping output order could be surprising. Mitigation: sort within `groupEntriesByMonth` to guarantee order regardless of input.

## References

### Internal
- Current implementation: `frontend/components/running-tab/TabHistory.tsx` (entire file)
- Existing collapsible pattern: `TabHistory.tsx:329-401` (`SearchedMonthGroup`)
- Existing collapsible pattern: `frontend/components/running-tab/ExpenseList.tsx` (status groups)
- History types & colors: `TabHistory.tsx:33-42` (`historyTypeConfig`)
- Currency formatter: `frontend/components/running-tab/BalanceDisplay.tsx:12-19` (`formatVND`)
- Date formatter: `frontend/lib/formatters.ts:102-110` (`formatDateTime`)
- Types: `frontend/types/runningTab.ts:31-45` (`TabHistoryType`, `TabHistoryEntry`)
- Store: `frontend/stores/runningTabStore.ts` (no changes needed)
