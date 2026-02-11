"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, CalendarPlus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ScheduleTaskFormProps {
  onScheduleTask: (title: string, scheduledAt: string) => void;
  disabled?: boolean;
}

type ScheduleStep = "date" | "time";

export function ScheduleTaskForm({ onScheduleTask, disabled = false }: ScheduleTaskFormProps) {
  const [title, setTitle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("PM");
  const [step, setStep] = useState<ScheduleStep>("date");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isDialogOpen) {
      setStep("date");
    }
  }, [isDialogOpen]);

  const handleScheduleClick = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setIsDialogOpen(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep("time");
    }
  };

  const handleConfirmSchedule = () => {
    if (!selectedDate) return;

    let hour = parseInt(selectedHour, 10);
    if (selectedPeriod === "PM" && hour !== 12) {
      hour += 12;
    } else if (selectedPeriod === "AM" && hour === 12) {
      hour = 0;
    }

    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(hour, parseInt(selectedMinute, 10), 0, 0);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onScheduleTask(trimmedTitle, scheduledDate.toISOString());

    setTitle("");
    setSelectedDate(undefined);
    setSelectedHour("12");
    setSelectedMinute("00");
    setSelectedPeriod("PM");
    setStep("date");
    setIsDialogOpen(false);

    if (window.innerWidth >= 768) {
      inputRef.current?.focus();
    } else {
      textareaRef.current?.focus();
    }
  };

  const hours = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const minutes = ["00", "15", "30", "45"];

  const hasContent = title.trim().length > 0;

  return (
    <>
      <div className="space-y-4">
        {/* Section label */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarPlus className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Schedule Event</span>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block space-y-3">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Schedule an event..."
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
                handleScheduleClick();
              }
            }}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleScheduleClick}
              disabled={disabled || !hasContent}
              className={cn(
                "flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                hasContent
                  ? "bg-violet-500/15 text-violet-500 dark:text-violet-400 hover:bg-violet-500/25 active:scale-[0.97]"
                  : "text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              Schedule
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          <textarea
            ref={textareaRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Schedule an event..."
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

          <button
            type="button"
            onClick={handleScheduleClick}
            disabled={disabled || !hasContent}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-violet-500/15 text-violet-500 dark:text-violet-400 hover:bg-violet-500/25 active:scale-[0.97]"
                : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            Schedule
          </button>
        </div>
      </div>

      {/* Date/Time Picker Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === "date" ? (
                <>
                  <CalendarIcon className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                  Pick a Date
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                  Pick a Time
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {step === "date" ? (
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </div>
          ) : (
            <div className="py-4 space-y-6">
              {/* Selected Date Display */}
              <div className="text-center rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Selected date</p>
                <p className="text-base font-medium mt-1">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
                </p>
              </div>

              {/* Time Picker */}
              <div className="space-y-4">
                {/* Hour Selection */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Hour</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setSelectedHour(hour)}
                        className={cn(
                          "p-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                          selectedHour === hour
                            ? "bg-violet-500 text-white shadow-sm"
                            : "bg-muted/50 hover:bg-muted text-foreground"
                        )}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minute Selection */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Minute</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => setSelectedMinute(minute)}
                        className={cn(
                          "p-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                          selectedMinute === minute
                            ? "bg-violet-500 text-white shadow-sm"
                            : "bg-muted/50 hover:bg-muted text-foreground"
                        )}
                      >
                        :{minute}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AM/PM Selection */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Period</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["AM", "PM"] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setSelectedPeriod(period)}
                        className={cn(
                          "p-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                          selectedPeriod === period
                            ? "bg-violet-500 text-white shadow-sm"
                            : "bg-muted/50 hover:bg-muted text-foreground"
                        )}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Preview */}
                <div className="text-center pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Scheduled for</p>
                  <p className="text-xl font-semibold text-violet-500 dark:text-violet-400 mt-1 tabular-nums">
                    {selectedHour}:{selectedMinute} {selectedPeriod}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("date")}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 active:scale-[0.97]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSchedule}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-violet-500 text-white text-sm font-medium shadow-sm transition-all duration-200 hover:bg-violet-600 active:scale-[0.97]"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
