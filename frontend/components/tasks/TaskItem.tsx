"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CreatorAvatar } from "./CreatorAvatar";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/tasks";
import { formatDistanceToNow } from "date-fns";

interface TaskItemProps {
  task: Task;
  creatorName?: string;
  completerName?: string;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  canComplete: boolean;
  canDelete?: boolean;
}

export function TaskItem({
  task,
  creatorName,
  completerName,
  onComplete,
  onUncomplete,
  onDelete,
  canComplete,
  canDelete = false,
}: TaskItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isCompleted = task.status === "completed";

  const handleCheckChange = (checked: boolean) => {
    if (!canComplete) return;
    if (checked) {
      onComplete(task.id);
    } else {
      onUncomplete(task.id);
    }
  };

  // Long press handler for delete (mobile)
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    if (!isCompleted || !canDelete) return;
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
    if (!isCompleted || !canDelete) return;
    e.preventDefault();
    setShowDeleteConfirm(true);
  };

  // Determine card style based on priority and completion status
  const getCardStyle = () => {
    if (isCompleted) {
      return "bg-[#F0FDF4] border-transparent";
    }
    return "bg-white border-transparent";
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 p-3 rounded-[14px] border transition-all",
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
      {/* Delete X button for completed tasks - admin only */}
      {isCompleted && canDelete && !showDeleteConfirm && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
          title="Remove completed task"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Main row: Checkbox + task title + attachment */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckChange}
          disabled={!canComplete}
          className={cn(
            "h-5 w-5 border-2 mt-0.5 flex-shrink-0 rounded-md",
            isCompleted
              ? "border-[#22C55E] data-[state=checked]:bg-[#22C55E]"
              : task.priority === "urgent"
                ? "border-[#F97316]"
                : "border-[#0891B2]"
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span className={cn("font-medium", isCompleted && "line-through")}>
              {task.title}
            </span>
            {task.priority === "urgent" && (
              <Badge className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-sm flex-shrink-0">
                Urgent
              </Badge>
            )}
          </div>
        </div>

      </div>

      {/* Creator info row (below task title) */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pl-8">
        {creatorName && (
          <div className="flex items-center gap-1">
            <CreatorAvatar name={creatorName} size="sm" />
            <span>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
          </div>
        )}

        {isCompleted && completerName && task.completedAt && (
          <div className="flex items-center gap-1 ml-2">
            <span>&#8226;</span>
            <CreatorAvatar name={completerName} size="sm" />
            <span>Completed {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}</span>
          </div>
        )}
      </div>

      {showDeleteConfirm && canDelete && (
        <div className="flex gap-2">
          <button
            onClick={() => onDelete(task.id)}
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
