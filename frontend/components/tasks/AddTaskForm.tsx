"use client";

import { useState, useRef, useEffect } from "react";
import { Zap } from "lucide-react";
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
    <div className="space-y-5">
      {/* Bold section header */}
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl md:text-3xl tracking-tight text-foreground">
          New Task
        </h2>
        <span className="text-xs font-semibold uppercase tracking-widest text-orange-500/60">
          01
        </span>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block space-y-4">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task title"
          disabled={disabled}
          className={cn(
            "w-full rounded-2xl border-2 bg-background/60 px-5 py-4 text-base outline-none transition-all duration-300",
            "placeholder:text-muted-foreground/40 placeholder:font-light",
            "focus:border-orange-400 focus:bg-background focus:shadow-[0_0_0_4px_oklch(0.65_0.20_45/0.1)]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createTask("regular");
            }
          }}
        />

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => createTask("regular")}
            disabled={disabled || !hasContent}
            className={cn(
              "btn-chunky px-6 py-3 text-sm rounded-xl",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              hasContent
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:bg-emerald-700"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => createTask("urgent")}
            disabled={disabled || !hasContent}
            className={cn(
              "btn-chunky px-6 py-3 text-sm rounded-xl",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              hasContent
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:bg-orange-600"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            <Zap className="h-4 w-4" />
            Urgent
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task title"
          disabled={disabled}
          rows={3}
          className={cn(
            "w-full rounded-2xl border-2 bg-background/60 px-5 py-4 text-base resize-none outline-none transition-all duration-300",
            "placeholder:text-muted-foreground/40 placeholder:font-light",
            "focus:border-orange-400 focus:bg-background focus:shadow-[0_0_0_4px_oklch(0.65_0.20_45/0.1)]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => createTask("regular")}
            disabled={disabled || !hasContent}
            className={cn(
              "btn-chunky py-4 text-sm rounded-xl",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => createTask("urgent")}
            disabled={disabled || !hasContent}
            className={cn(
              "btn-chunky py-4 text-sm rounded-xl",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            <Zap className="h-4 w-4" />
            Urgent
          </button>
        </div>
      </div>
    </div>
  );
}
