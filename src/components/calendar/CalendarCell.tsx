"use client";

import { PerformanceChip } from "./PerformanceChip";
import { isToday } from "@/lib/utils/date";
import type { Performance } from "@/types";

interface CalendarCellProps {
  year: number;
  month: number;
  day: number | null;
  performances: Performance[];
  isSelected?: boolean;
  onSelect?: (day: number) => void;
}

export function CalendarCell({
  year,
  month,
  day,
  performances,
  isSelected,
  onSelect,
}: CalendarCellProps) {
  if (day === null) {
    return <div className="min-h-[110px] bg-surface-container-low/40" />;
  }

  const today = isToday(year, month, day);
  const hasPerfs = performances.length > 0;

  return (
    <div
      onClick={() => hasPerfs && onSelect?.(day)}
      className={`min-h-[110px] p-2 transition-colors ${
        hasPerfs
          ? "cursor-pointer hover:bg-surface-container-low/70"
          : "hover:bg-surface-container-low/40"
      } ${
        isSelected
          ? "bg-primary-fixed ring-2 ring-primary-container"
          : today && !isSelected
          ? "bg-primary-fixed/50"
          : "bg-surface-container-lowest"
      }`}
    >
      <span
        className={`text-sm font-bold inline-flex items-center justify-center ${
          today
            ? "bg-primary text-on-primary rounded-full w-6 h-6"
            : isSelected
            ? "text-on-primary-fixed-variant"
            : "text-on-surface-variant"
        }`}
      >
        {day}
      </span>
      <div className="mt-1.5 space-y-0.5">
        {performances.slice(0, 3).map((p) => (
          <PerformanceChip key={p.id} performance={p} />
        ))}
        {performances.length > 3 && (
          <span className="text-[10px] font-bold text-on-surface-variant pl-1.5">
            +{performances.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}
