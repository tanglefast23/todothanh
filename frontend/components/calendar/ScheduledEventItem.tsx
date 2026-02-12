"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CreatorAvatar } from "@/components/tasks/CreatorAvatar";
import { cn } from "@/lib/utils";
import type { ScheduledEvent } from "@/types/scheduled-events";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";

interface ScheduledEventItemProps {
  event: ScheduledEvent;
  creatorName?: string;
  isCreatorMaster?: boolean;
  completerName?: string;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  canComplete: boolean;
  canDelete?: boolean;
}

export function ScheduledEventItem({
  event,
  creatorName,
  isCreatorMaster = true,
  completerName,
  onComplete,
  onUncomplete,
  onDelete,
  canComplete,
  canDelete = false,
}: ScheduledEventItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isCompleted = event.status === "completed";
  const scheduledDate = new Date(event.scheduledAt);
  const isOverdue = isPast(scheduledDate) && !isCompleted;

  const handleCheckChange = (checked: boolean) => {
    if (!canComplete) return;
    if (checked) {
      onComplete(event.id);
    } else {
      onUncomplete(event.id);
    }
  };

  // Long press handler for delete (mobile)
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    if (!isCompleted) return;
    const timer = setTimeout(() => {
      setShowDeleteConfirm(true);
    }, 500); // 500ms long press
    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isCompleted) return;
    e.preventDefault();
    setShowDeleteConfirm(true);
  };

  // Color-coded gradient cards per Pencil design
  const getCardStyle = () => {
    if (isCompleted) {
      return "bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] border-[#BBF7D0]";
    }
    if (isOverdue) {
      return "bg-gradient-to-b from-[#FFF1F2] to-[#FFE4E6] border-[#FCA5A5]";
    }
    if (isToday(scheduledDate)) {
      return "bg-gradient-to-b from-[#FFFBEB] to-[#FEF9C3] border-[#FCD34D]";
    }
    return "bg-gradient-to-b from-[#F5F3FF] to-[#EDE9FE] border-[#DDD6FE]";
  };

  // Accent color for checkbox and time
  const getAccentColor = () => {
    if (isCompleted) return "#22C55E";
    if (isOverdue) return "#EF4444";
    if (isToday(scheduledDate)) return "#F59E0B";
    return "#7C3AED";
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 p-4 rounded-[18px] border-[1.5px] transition-all",
        getCardStyle(),
        isCompleted && "opacity-70",
        showDeleteConfirm && "ring-2 ring-destructive"
      )}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onContextMenu={handleContextMenu}
    >
      {/* Delete X button for completed events - admin only */}
      {isCompleted && canDelete && !showDeleteConfirm && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(event.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
          title="Remove completed event"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Top row: Time (prominent) + Creator info (subtle, right-aligned) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1.5"
            style={{ color: isCompleted ? "#9CA3AF" : getAccentColor() }}
          >
            <span className="text-xl font-bold tracking-tight">{format(scheduledDate, "h:mm a")}</span>
          </div>
          {isOverdue && !isCompleted && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#EF4444] text-white">Overdue</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
          {creatorName && (
            <div className="flex items-center gap-1">
              <CreatorAvatar name={creatorName} size="sm" />
              <span>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</span>
            </div>
          )}
          {isCompleted && completerName && event.completedAt && (
            <div className="flex items-center gap-1 ml-1">
              <span>&#8226;</span>
              <CreatorAvatar name={completerName} size="sm" />
              <span>{formatDistanceToNow(new Date(event.completedAt), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content row: Checkbox and event description */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckChange}
          disabled={!canComplete}
          className="h-5 w-5 border-2 mt-0.5 flex-shrink-0 rounded-md"
          style={{
            borderColor: getAccentColor(),
            ...(isCompleted ? { backgroundColor: getAccentColor() } : {}),
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={cn("font-medium", isCompleted && "line-through")}>
              {event.title}
            </span>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="flex gap-2">
          <button
            onClick={() => onDelete(event.id)}
            className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded"
          >
            Delete
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-2 py-1 text-xs bg-secondary rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
