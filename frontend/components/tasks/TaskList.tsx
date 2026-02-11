"use client";

import { useMemo } from "react";
import { TaskItem } from "./TaskItem";
import type { Task } from "@/types/tasks";

interface TaskListProps {
  tasks: Task[];
  getOwnerName: (ownerId: string | null) => string | undefined;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAttachment?: (taskId: string, url: string) => void;
  onClearAttachment?: (taskId: string) => void;
  canComplete: boolean;
  canDelete?: boolean;
  isMaster?: boolean;
}

export function TaskList({
  tasks,
  getOwnerName,
  onComplete,
  onUncomplete,
  onDelete,
  onAttachment,
  onClearAttachment,
  canComplete,
  canDelete = false,
  isMaster = false,
}: TaskListProps) {
  // Separate tasks by status and priority
  const { normalTasks, urgentTasks, completedTasks } = useMemo(() => {
    const normal: Task[] = [];
    const urgent: Task[] = [];
    const completed: Task[] = [];

    for (const task of tasks) {
      if (task.status === "completed") {
        completed.push(task);
      } else if (task.priority === "urgent") {
        urgent.push(task);
      } else {
        normal.push(task);
      }
    }

    // Sort by creation date (newest first)
    normal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    urgent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sort completed by completion date (most recent first)
    completed.sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });

    return { normalTasks: normal, urgentTasks: urgent, completedTasks: completed };
  }, [tasks]);

  const hasPendingTasks = normalTasks.length > 0 || urgentTasks.length > 0;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No tasks yet.</p>
        <p className="text-sm mt-1">Add your first task above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Tasks - Side by Side Columns */}
      {hasPendingTasks && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Urgent Tasks Column */}
          <div className="rounded-[20px] bg-gradient-to-b from-[#FFF7ED] to-[#FFF1F2] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#F97316]">Urgent</span>
              <span className="flex items-center justify-center px-2.5 py-0.5 rounded-[10px] bg-[#F97316] text-white text-[11px] font-bold">
                {urgentTasks.length}
              </span>
            </div>
            {urgentTasks.length > 0 ? (
              <div className="space-y-3">
                {urgentTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    creatorName={getOwnerName(task.createdBy)}
                    completerName={undefined}
                    onComplete={onComplete}
                    onUncomplete={onUncomplete}
                    onDelete={onDelete}
                    onAttachment={onAttachment}
                    onClearAttachment={onClearAttachment}
                    canComplete={canComplete}
                    canDelete={canDelete}
                    isMaster={isMaster}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No urgent tasks</p>
            )}
          </div>

          {/* Normal Tasks Column */}
          <div className="rounded-[20px] bg-gradient-to-b from-[#F0F9FF] to-[#EFF6FF] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#0891B2]">Normal</span>
              <span className="flex items-center justify-center px-2.5 py-0.5 rounded-[10px] bg-[#0891B2] text-white text-[11px] font-bold">
                {normalTasks.length}
              </span>
            </div>
            {normalTasks.length > 0 ? (
              <div className="space-y-3">
                {normalTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    creatorName={getOwnerName(task.createdBy)}
                    completerName={undefined}
                    onComplete={onComplete}
                    onUncomplete={onUncomplete}
                    onDelete={onDelete}
                    onAttachment={onAttachment}
                    onClearAttachment={onClearAttachment}
                    canComplete={canComplete}
                    canDelete={canDelete}
                    isMaster={isMaster}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No normal tasks</p>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      {completedTasks.length > 0 && hasPendingTasks && (
        <div className="h-px bg-[#F3F4F6]" />
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[#22C55E]">Completed</span>
            <span className="flex items-center justify-center px-2.5 py-0.5 rounded-[10px] bg-[#22C55E] text-white text-[11px] font-bold">
              {completedTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                creatorName={getOwnerName(task.createdBy)}
                completerName={getOwnerName(task.completedBy)}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
                onDelete={onDelete}
                onAttachment={onAttachment}
                onClearAttachment={onClearAttachment}
                canComplete={canComplete}
                canDelete={canDelete}
                isMaster={isMaster}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
