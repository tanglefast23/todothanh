/**
 * Tasks Zustand store with localStorage persistence
 * Manages task list, creation, completion, and deletion
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, TaskPriority } from "@/types/tasks";
import {
  upsertTasks,
  updateTask,
  deleteTask as deleteTaskFromSupabase,
} from "@/lib/supabase/queries/tasks";
import { deleteAttachment } from "@/lib/supabase/queries/storage";
import { retryWithBackoff } from "@/lib/supabase/sync/utils";

const TASKS_STORAGE_KEY = "tasks-storage";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface TasksState {
  tasks: Task[];

  // Bulk setter for Supabase sync
  setTasks: (tasks: Task[]) => void;

  // Task CRUD
  addTask: (title: string, priority: TaskPriority, createdBy: string | null) => string;
  completeTask: (id: string, completedBy: string | null) => void;
  uncompleteTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Attachment management
  setTaskAttachment: (taskId: string, url: string) => void;
  clearTaskAttachment: (taskId: string) => void;

  // Getters
  getPendingTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],

      setTasks: (tasks) => set({ tasks }),

      addTask: (title, priority, createdBy) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newTask: Task = {
          id,
          title,
          priority,
          createdBy,
          createdAt: now,
          completedBy: null,
          completedAt: null,
          status: "pending",
          attachmentUrl: null,
          updatedAt: now,
        };

        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));

        // Sync to Supabase with retry so a single network blip doesn't lose the write
        retryWithBackoff(() => upsertTasks([newTask]), 3, "addTask").catch((error) => {
          console.error("[Store] Failed to sync new task to Supabase after retries:", error);
        });

        return id;
      },

      completeTask: (id, completedBy) => {
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: "completed" as const,
                  completedBy,
                  completedAt: now,
                  updatedAt: now,
                }
              : task
          ),
        }));

        // Sync to Supabase with retry
        retryWithBackoff(
          () => updateTask(id, { status: "completed", completedBy, completedAt: now, updatedAt: now }),
          3, "completeTask"
        ).catch((error) => {
          console.error("[Store] Failed to sync task completion to Supabase after retries:", error);
        });
      },

      uncompleteTask: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: "pending" as const,
                  completedBy: null,
                  completedAt: null,
                  updatedAt: now,
                }
              : task
          ),
        }));

        // Sync to Supabase with retry
        retryWithBackoff(
          () => updateTask(id, { status: "pending", completedBy: null, completedAt: null, updatedAt: now }),
          3, "uncompleteTask"
        ).catch((error) => {
          console.error("[Store] Failed to sync task uncompletion to Supabase after retries:", error);
        });
      },

      deleteTask: (id) => {
        const taskToDelete = get().tasks.find((task) => task.id === id);
        if (!taskToDelete) return;

        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));

        // Sync to Supabase with retry — restore locally if all retries fail
        retryWithBackoff(() => deleteTaskFromSupabase(id), 3, "deleteTask").then((result) => {
          if (result === undefined) {
            // All retries failed — restore to avoid cross-device drift
            set((state) => {
              if (state.tasks.some((task) => task.id === id)) return state;
              return { tasks: [taskToDelete, ...state.tasks] };
            });
          }
        });
      },

      setTaskAttachment: (taskId, url) => {
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, attachmentUrl: url, updatedAt: now }
              : task
          ),
        }));

        // Sync to Supabase with retry
        retryWithBackoff(
          () => updateTask(taskId, { attachmentUrl: url, updatedAt: now }),
          3, "setTaskAttachment"
        ).catch((error) => {
          console.error("[Store] Failed to sync task attachment to Supabase after retries:", error);
        });
      },

      clearTaskAttachment: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task?.attachmentUrl) return;

        const oldUrl = task.attachmentUrl;
        const now = new Date().toISOString();

        // Update local state
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, attachmentUrl: null, updatedAt: now }
              : t
          ),
        }));

        // Delete from Supabase Storage
        deleteAttachment(oldUrl).catch((error) => {
          console.error("[Store] Failed to delete task attachment from Storage:", error);
        });

        // Sync to Supabase with retry
        retryWithBackoff(
          () => updateTask(taskId, { attachmentUrl: null, updatedAt: now }),
          3, "clearTaskAttachment"
        ).catch((error) => {
          console.error("[Store] Failed to sync task attachment removal to Supabase after retries:", error);
        });
      },

      getPendingTasks: () => {
        return get().tasks.filter((task) => task.status === "pending");
      },

      getCompletedTasks: () => {
        return get().tasks.filter((task) => task.status === "completed");
      },

      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id);
      },
    }),
    {
      name: TASKS_STORAGE_KEY,
    }
  )
);
