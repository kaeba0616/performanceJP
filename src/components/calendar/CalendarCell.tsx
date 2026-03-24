"use client";

import { PerformanceChip } from "./PerformanceChip";
import { isToday } from "@/lib/utils/date";
import type { Performance } from "@/types";

interface CalendarCellProps {
  year: number;
  month: number;
  day: number | null;
  performances: Performance[];
}

export function CalendarCell({ year, month, day, performances }: CalendarCellProps) {
  if (day === null) {
    return <div className="min-h-24 bg-muted/30" />;
  }

  const today = isToday(year, month, day);

  return (
    <div
      className={`min-h-24 border border-border/50 p-1 ${
        today ? "bg-primary/5 ring-1 ring-primary/30" : ""
      }`}
    >
      <span
        className={`text-sm font-medium ${
          today
            ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
            : "text-muted-foreground"
        }`}
      >
        {day}
      </span>
      <div className="mt-1 space-y-0.5">
        {performances.slice(0, 3).map((p) => (
          <PerformanceChip key={p.id} performance={p} />
        ))}
        {performances.length > 3 && (
          <span className="text-[10px] text-muted-foreground pl-1">
            +{performances.length - 3}개 더
          </span>
        )}
      </div>
    </div>
  );
}
