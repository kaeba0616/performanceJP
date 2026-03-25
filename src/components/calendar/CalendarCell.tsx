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

export function CalendarCell({ year, month, day, performances, isSelected, onSelect }: CalendarCellProps) {
  if (day === null) {
    return <div className="min-h-[100px] bg-[#f2f3ff]/30" />;
  }

  const today = isToday(year, month, day);
  const hasPerfs = performances.length > 0;

  return (
    <div
      onClick={() => hasPerfs && onSelect?.(day)}
      className={`min-h-[100px] border border-[rgba(194,198,214,0.15)] p-1.5 transition-colors ${
        hasPerfs ? "cursor-pointer hover:bg-[#f2f3ff]/50" : ""
      } ${isSelected ? "bg-[#f2f3ff] ring-2 ring-[#0058be]/30" : ""} ${
        today && !isSelected ? "bg-[rgba(0,88,190,0.03)] ring-1 ring-[#0058be]/20" : ""
      }`}
    >
      <span
        className={`text-sm font-medium inline-flex items-center justify-center ${
          today
            ? "bg-[#0058be] text-white rounded-full w-6 h-6"
            : "text-[#727785]"
        }`}
      >
        {day}
      </span>
      <div className="mt-1 space-y-0.5">
        {performances.slice(0, 3).map((p) => (
          <PerformanceChip key={p.id} performance={p} />
        ))}
        {performances.length > 3 && (
          <span className="text-[10px] text-[#727785] pl-1">
            +{performances.length - 3}개 더
          </span>
        )}
      </div>
    </div>
  );
}
