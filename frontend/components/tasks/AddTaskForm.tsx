"use client";

import { useState, useRef, useEffect } from "react";
import { ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/tasks";

interface AddTaskFormProps {
  onAddTask: (title: string, priority: TaskPriority) => void;
  disabled?: boolean;
}

export function AddTaskForm({ onAddTask, disabled = false }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.innerWidth >= 768) {
        inputRef.current?.focus();
      } else {
        textareaRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const createTask = (priority: TaskPriority) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onAddTask(trimmedTitle, priority);
    setTitle("");
    if (window.innerWidth >= 768) {
      inputRef.current?.focus();
    } else {
      textareaRef.current?.focus();
    }
  };

  const hasContent = title.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Section label */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <ListPlus className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">New Task</span>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block space-y-3">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task title"
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-all duration-200",
            "placeholder:text-muted-foreground/50",
            "focus:border-ring focus:ring-2 focus:ring-ring/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-input/20 dark:border-input"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createTask("regular");
            }
          }}
        />

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => createTask("regular")}
            disabled={disabled || !hasContent}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              hasContent
                ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/25 active:scale-[0.97]"
                : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => createTask("urgent")}
            disabled={disabled || !hasContent}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              hasContent
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 active:scale-[0.97]"
                : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            Urgent
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task title"
          disabled={disabled}
          rows={3}
          className={cn(
            "w-full rounded-xl border bg-background px-4 py-3 text-base resize-none outline-none transition-all duration-200",
            "placeholder:text-muted-foreground/50",
            "focus:border-ring focus:ring-2 focus:ring-ring/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-input/20 dark:border-input"
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => createTask("regular")}
            disabled={disabled || !hasContent}
            className={cn(
              "py-3 text-sm font-medium rounded-xl transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/25 active:scale-[0.97]"
                : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => createTask("urgent")}
            disabled={disabled || !hasContent}
            className={cn(
              "py-3 text-sm font-medium rounded-xl transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 active:scale-[0.97]"
                : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            Urgent
          </button>
        </div>
      </div>
    </div>
  );
}
