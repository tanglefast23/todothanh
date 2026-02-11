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
        {/* Section header with numbered badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F6F7F8] text-[11px] font-bold text-[#9CA3AF]">
            02
          </span>
          <h2 className="font-display text-xl tracking-tight text-[#1A1A1A]">
            Schedule
          </h2>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block space-y-4">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title..."
            aria-label="Event title"
            disabled={disabled}
            className="w-full rounded-2xl border-2 border-[#E5E7EB] bg-[#F6F7F8] px-[18px] h-[52px] text-[15px] outline-none transition-all duration-200 placeholder:text-[#C0C4CC] focus:border-violet-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(124,58,237,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleScheduleClick();
              }
            }}
          />

          <button
            type="button"
            onClick={handleScheduleClick}
            disabled={disabled || !hasContent}
            className={cn(
              "flex items-center justify-center gap-2 w-full h-12 rounded-[14px] text-[15px] font-bold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              hasContent
                ? "bg-[#7C3AED] text-white shadow-md hover:bg-[#6D28D9] active:scale-[0.97]"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            <CalendarIcon className="h-[18px] w-[18px]" />
            Schedule Event
          </button>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          <textarea
            ref={textareaRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title..."
            aria-label="Event title"
            disabled={disabled}
            rows={2}
            className="w-full rounded-2xl border-2 border-[#E5E7EB] bg-[#F6F7F8] px-[18px] py-4 text-[15px] resize-none outline-none transition-all duration-200 placeholder:text-[#C0C4CC] focus:border-violet-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(124,58,237,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
          />

          <button
            type="button"
            onClick={handleScheduleClick}
            disabled={disabled || !hasContent}
            className={cn(
              "flex items-center justify-center gap-2 w-full h-12 rounded-[14px] text-[15px] font-bold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hasContent
                ? "bg-[#7C3AED] text-white shadow-md active:scale-[0.97]"
                : "bg-muted/40 text-muted-foreground/30"
            )}
          >
            <CalendarIcon className="h-[18px] w-[18px]" />
            Schedule Event
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
