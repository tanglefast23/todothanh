"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Zap } from "lucide-react";
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
      {/* Section header with numbered badge */}
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F6F7F8] text-[11px] font-bold text-[#9CA3AF]">
          01
        </span>
        <h2 className="font-display text-xl tracking-tight text-[#1A1A1A]">
          New Task
        </h2>
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
          className="w-full rounded-2xl border-2 border-[#E5E7EB] bg-[#F6F7F8] px-[18px] h-[52px] text-[15px] outline-none transition-all duration-200 placeholder:text-[#C0C4CC] focus:border-orange-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(251,146,60,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createTask("regular");
            }
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => createTask("regular")}
            disabled={disabled || !hasContent}
            className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-[14px] text-[15px] font-bold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              hasContent
                ? "bg-[#22C55E] text-white shadow-md hover:bg-[#16A34A] active:scale-[0.97]"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            <Plus className="h-[18px] w-[18px]" />
            Normal
          </button>
          <button
            type="button"
            onClick={() => createTask("urgent")}
            disabled={disabled || !hasContent}
            className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-[14px] text-[15px] font-bold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              hasContent
                ? "bg-[#F97316] text-white shadow-md hover:bg-[#EA580C] active:scale-[0.97]"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            <Zap className="h-[18px] w-[18px]" />
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
          rows={2}
          className="w-full rounded-2xl border-2 border-[#E5E7EB] bg-[#F6F7F8] px-[18px] py-4 text-[15px] resize-none outline-none transition-all duration-200 placeholder:text-[#C0C4CC] focus:border-orange-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(251,146,60,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => createTask("regular")}
            disabled={disabled || !hasContent}
            className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-[14px] text-[15px] font-bold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-[#22C55E] text-white shadow-md active:scale-[0.97]"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            <Plus className="h-[18px] w-[18px]" />
            Normal
          </button>
          <button
            type="button"
            onClick={() => createTask("urgent")}
            disabled={disabled || !hasContent}
            className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-[14px] text-[15px] font-bold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-[#F97316] text-white shadow-md active:scale-[0.97]"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            <Zap className="h-[18px] w-[18px]" />
            Urgent
          </button>
        </div>
      </div>
    </div>
  );
}
