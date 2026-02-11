"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { TaskList } from "@/components/tasks/TaskList";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useTasksStore } from "@/stores/tasksStore";
import { useOwnerStore } from "@/stores/ownerStore";

export default function TasksPage() {
  // Redirect to login if not authenticated
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthGuard();

  // Tasks state
  const tasks = useTasksStore((state) => state.tasks);
  const completeTask = useTasksStore((state) => state.completeTask);
  const uncompleteTask = useTasksStore((state) => state.uncompleteTask);
  const deleteTask = useTasksStore((state) => state.deleteTask);
  const setTaskAttachment = useTasksStore((state) => state.setTaskAttachment);
  const clearTaskAttachment = useTasksStore((state) => state.clearTaskAttachment);

  // Owner state
  const owners = useOwnerStore((state) => state.owners);
  const getActiveOwnerId = useOwnerStore((state) => state.getActiveOwnerId);
  const isMasterLoggedIn = useOwnerStore((state) => state.isMasterLoggedIn);

  // Hydration-safe
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeOwnerId = isMounted ? getActiveOwnerId() : null;
  const isMaster = isMounted ? isMasterLoggedIn() : false;

  // Get owner name by ID
  const getOwnerName = useCallback((ownerId: string | null): string | undefined => {
    if (!ownerId) return undefined;
    const owner = owners.find((o) => o.id === ownerId);
    return owner?.name;
  }, [owners]);

  // Handle completing a task
  const handleComplete = useCallback((id: string) => {
    if (!activeOwnerId) return;
    completeTask(id, activeOwnerId);
  }, [activeOwnerId, completeTask]);

  // Handle uncompleting a task
  const handleUncomplete = useCallback((id: string) => {
    uncompleteTask(id);
  }, [uncompleteTask]);

  // Handle deleting a task
  const handleDelete = useCallback((id: string) => {
    if (!isMaster) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status !== "completed") return;
    deleteTask(id);
  }, [deleteTask, isMaster, tasks]);

  // Handle adding attachment to a task
  const handleAttachment = useCallback((taskId: string, url: string) => {
    setTaskAttachment(taskId, url);
  }, [setTaskAttachment]);

  // Handle clearing attachment from a task
  const handleClearAttachment = useCallback((taskId: string) => {
    clearTaskAttachment(taskId);
  }, [clearTaskAttachment]);

  // Show loading state while checking authentication
  if (isAuthLoading || !isAuthenticated) {
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
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Tasks</h1>

          {/* Task List */}
          <TaskList
            tasks={tasks}
            getOwnerName={getOwnerName}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            onDelete={handleDelete}
            onAttachment={handleAttachment}
            onClearAttachment={handleClearAttachment}
            canComplete={true}
            canDelete={isMaster}
            isMaster={isMaster}
          />
        </div>
      </main>
    </div>
  );
}
