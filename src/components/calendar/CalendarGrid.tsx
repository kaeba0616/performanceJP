"use client";

import { useState } from "react";
import { CalendarCell } from "./CalendarCell";
import { Button } from "@/components/ui/button";
import { getDaysInMonth, getFirstDayOfMonth, getMonthName } from "@/lib/utils/date";
import type { Performance } from "@/types";

interface CalendarGridProps {
  performances: Performance[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarGrid({ performances }: CalendarGridProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Group performances by date
  const perfByDate = new Map<number, Performance[]>();
  performances.forEach((p) => {
    const startDate = new Date(p.start_date);
    const endDate = p.end_date ? new Date(p.end_date) : startDate;

    // Add performance to each day it spans
    const current = new Date(startDate);
    while (current <= endDate) {
      if (current.getFullYear() === year && current.getMonth() === month) {
        const day = current.getDate();
        if (!perfByDate.has(day)) perfByDate.set(day, []);
        perfByDate.get(day)!.push(p);
      }
      current.setDate(current.getDate() + 1);
    }
  });

  // Build calendar cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">
            {year}년 {getMonthName(month)}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}>
            &lt;
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            &gt;
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => (
          <CalendarCell
            key={i}
            year={year}
            month={month}
            day={day}
            performances={day ? perfByDate.get(day) || [] : []}
          />
        ))}
      </div>
    </div>
  );
}
