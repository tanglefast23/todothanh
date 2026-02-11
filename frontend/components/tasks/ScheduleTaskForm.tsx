"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
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
      <div className="space-y-5">
        {/* Bold section header */}
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl md:text-3xl tracking-tight text-foreground">
            Schedule
          </h2>
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-500/60">
            02
          </span>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block space-y-4">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's coming up?"
            aria-label="Event title"
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
                "btn-chunky px-6 py-3 text-sm rounded-xl",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                hasContent
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 hover:bg-violet-700"
                  : "bg-muted/40 text-muted-foreground/30"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              Schedule
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          <textarea
            ref={textareaRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's coming up?"
            aria-label="Event title"
            disabled={disabled}
            rows={3}
            className={cn(
              "w-full rounded-2xl border-2 bg-background/60 px-5 py-4 text-base resize-none outline-none transition-all duration-300",
              "placeholder:text-muted-foreground/40 placeholder:font-light",
              "focus:border-orange-400 focus:bg-background focus:shadow-[0_0_0_4px_oklch(0.65_0.20_45/0.1)]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />

          <button
            type="button"
            onClick={handleScheduleClick}
            disabled={disabled || !hasContent}
            className={cn(
              "btn-chunky w-full py-4 text-sm rounded-xl",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "bg-muted/40 text-muted-foreground/30"
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
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              {step === "date" ? (
                <>
                  <CalendarIcon className="h-5 w-5 text-violet-600" />
                  Pick a Date
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-violet-600" />
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
              <div className="text-center rounded-xl bg-violet-50 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Selected date</p>
                <p className="text-base font-medium mt-1">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
                </p>
              </div>

              {/* Time Picker */}
              <div className="space-y-5">
                {/* Hour Selection */}
                <div>
                  <label id="hour-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Hour</label>
                  <div role="group" aria-labelledby="hour-label" className="grid grid-cols-6 gap-1.5">
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setSelectedHour(hour)}
                        className={cn(
                          "min-h-[44px] rounded-xl text-sm font-semibold transition-all duration-150",
                          selectedHour === hour
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                            : "bg-muted/40 hover:bg-muted text-foreground"
                        )}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minute Selection */}
                <div>
                  <label id="minute-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Minute</label>
                  <div role="group" aria-labelledby="minute-label" className="grid grid-cols-4 gap-1.5">
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => setSelectedMinute(minute)}
                        className={cn(
                          "min-h-[44px] rounded-xl text-sm font-semibold transition-all duration-150",
                          selectedMinute === minute
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                            : "bg-muted/40 hover:bg-muted text-foreground"
                        )}
                      >
                        :{minute}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AM/PM Selection */}
                <div>
                  <label id="period-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Period</label>
                  <div role="group" aria-labelledby="period-label" className="grid grid-cols-2 gap-1.5">
                    {(["AM", "PM"] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setSelectedPeriod(period)}
                        className={cn(
                          "min-h-[44px] rounded-xl text-sm font-semibold transition-all duration-150",
                          selectedPeriod === period
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                            : "bg-muted/40 hover:bg-muted text-foreground"
                        )}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Preview */}
                <div className="text-center pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Scheduled for</p>
                  <p className="font-display text-3xl text-violet-600 mt-1 tabular-nums">
                    {selectedHour}:{selectedMinute} {selectedPeriod}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("date")}
                  className="btn-chunky flex-1 py-3 rounded-xl border-2 border-border text-sm text-muted-foreground hover:bg-muted/50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSchedule}
                  className="btn-chunky flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm shadow-lg shadow-violet-600/20 hover:bg-violet-700"
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
