"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { AddTaskForm } from "@/components/tasks/AddTaskForm";
import { ScheduleTaskForm } from "@/components/tasks/ScheduleTaskForm";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useTasksStore } from "@/stores/tasksStore";
import { useScheduledEventsStore } from "@/stores/scheduledEventsStore";
import { useOwnerStore } from "@/stores/ownerStore";
import type { TaskPriority } from "@/types/tasks";

export default function EntryPage() {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthGuard();

  const addTask = useTasksStore((state) => state.addTask);
  const addEvent = useScheduledEventsStore((state) => state.addEvent);
  const getActiveOwnerId = useOwnerStore((state) => state.getActiveOwnerId);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeOwnerId = isMounted ? getActiveOwnerId() : null;

  const handleAddTask = useCallback((title: string, priority: TaskPriority) => {
    if (!activeOwnerId) return;
    addTask(title, priority, activeOwnerId);
  }, [activeOwnerId, addTask]);

  const handleScheduleEvent = useCallback((title: string, scheduledAt: string) => {
    if (!activeOwnerId) return;
    addEvent(title, scheduledAt, activeOwnerId);
  }, [activeOwnerId, addEvent]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen page-atmosphere">
      <Header />

      <main className="flex-1 px-5 py-4 md:px-10 md:py-8">
        <div className="max-w-xl mx-auto bold-stagger space-y-6">
          {/* Task creation card */}
          <section
            aria-label="Add a new task"
            className="bold-card p-6 md:p-8"
          >
            <AddTaskForm
              onAddTask={handleAddTask}
              disabled={!isMounted || !activeOwnerId}
            />
          </section>

          {/* Schedule event card */}
          <section
            aria-label="Schedule an event"
            className="bold-card p-6 md:p-8"
          >
            <ScheduleTaskForm
              onScheduleTask={handleScheduleEvent}
              disabled={!isMounted || !activeOwnerId}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
