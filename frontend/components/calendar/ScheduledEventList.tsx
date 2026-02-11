"use client";

import { useMemo } from "react";
import { ScheduledEventItem } from "./ScheduledEventItem";
import type { ScheduledEvent } from "@/types/scheduled-events";
import { CalendarDays, CircleCheckBig } from "lucide-react";
import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
} from "date-fns";

interface ScheduledEventListProps {
  events: ScheduledEvent[];
  getOwnerName: (ownerId: string | null) => string | undefined;
  isOwnerMaster: (ownerId: string | null) => boolean;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  canComplete: boolean;
  isMaster: boolean;
  activeOwnerId: string | null;
}

interface EventsByDay {
  dateKey: string;
  displayDate: string;
  events: ScheduledEvent[];
}

function getDayTitle(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
}

function groupEventsByDay(events: ScheduledEvent[], dateField: "scheduledAt" | "completedAt"): EventsByDay[] {
  const groups = new Map<string, ScheduledEvent[]>();

  events.forEach((event) => {
    const dateValue = dateField === "completedAt" ? event.completedAt || event.scheduledAt : event.scheduledAt;
    const date = new Date(dateValue);
    const dateKey = startOfDay(date).toISOString();

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(event);
  });

  return Array.from(groups.entries()).map(([dateKey, events]) => ({
    dateKey,
    displayDate: getDayTitle(new Date(dateKey)),
    events,
  }));
}

export function ScheduledEventList({
  events,
  getOwnerName,
  isOwnerMaster,
  onComplete,
  onUncomplete,
  onDelete,
  canComplete,
  isMaster,
  activeOwnerId,
}: ScheduledEventListProps) {
  // Separate, sort, and group events by day
  const { pendingByDay, completedByDay } = useMemo(() => {
    const pending = events
      .filter((e) => e.status === "pending")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const completed = events
      .filter((e) => e.status === "completed")
      .sort((a, b) => new Date(b.completedAt || b.scheduledAt).getTime() - new Date(a.completedAt || a.scheduledAt).getTime());

    return {
      pendingByDay: groupEventsByDay(pending, "scheduledAt"),
      completedByDay: groupEventsByDay(completed, "completedAt"),
    };
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No scheduled events</p>
        <p className="text-sm">Schedule events from the Entry page</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Upcoming Events */}
      {pendingByDay.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="font-display text-xl text-[#1A1A1A]">Upcoming</h2>
          </div>

          {pendingByDay.map((dayGroup) => (
            <div key={dayGroup.dateKey} className="space-y-3">
              <h3 className="font-display text-[26px] leading-tight text-[#1A1A1A]">
                {dayGroup.displayDate}
              </h3>
              <div className="space-y-3">
                {dayGroup.events.map((event) => (
                  <ScheduledEventItem
                    key={event.id}
                    event={event}
                    creatorName={getOwnerName(event.createdBy)}
                    isCreatorMaster={isOwnerMaster(event.createdBy)}
                    completerName={getOwnerName(event.completedBy)}
                    onComplete={onComplete}
                    onUncomplete={onUncomplete}
                    onDelete={onDelete}
                    canComplete={canComplete}
                    canDelete={isMaster || event.createdBy === activeOwnerId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Events */}
      {completedByDay.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <CircleCheckBig className="h-5 w-5 text-[#22C55E]" />
            <h2 className="font-display text-xl text-[#1A1A1A]">Completed</h2>
          </div>

          {completedByDay.map((dayGroup) => (
            <div key={dayGroup.dateKey} className="space-y-3">
              <h3 className="font-display text-[22px] leading-tight text-[#1A1A1A]/70">
                {dayGroup.displayDate}
              </h3>
              <div className="space-y-3">
                {dayGroup.events.map((event) => (
                  <ScheduledEventItem
                    key={event.id}
                    event={event}
                    creatorName={getOwnerName(event.createdBy)}
                    isCreatorMaster={isOwnerMaster(event.createdBy)}
                    completerName={getOwnerName(event.completedBy)}
                    onComplete={onComplete}
                    onUncomplete={onUncomplete}
                    onDelete={onDelete}
                    canComplete={canComplete}
                    canDelete={isMaster || event.createdBy === activeOwnerId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
