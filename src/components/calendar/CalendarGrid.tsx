"use client";

import { useState } from "react";
import { CalendarCell } from "./CalendarCell";
import { Button } from "@/components/ui/button";
import { getDaysInMonth, getFirstDayOfMonth, getMonthName, formatDate } from "@/lib/utils/date";
import { PerformanceChip } from "./PerformanceChip";
import type { Performance } from "@/types";
import Link from "next/link";

interface CalendarGridProps {
  performances: Performance[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarGrid({ performances }: CalendarGridProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const goToPrevMonth = () => {
    setSelectedDay(null);
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const goToToday = () => {
    setSelectedDay(null);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Group performances by date
  const perfByDate = new Map<number, Performance[]>();
  performances.forEach((p) => {
    const startDate = new Date(p.start_date);
    const endDate = p.end_date ? new Date(p.end_date) : startDate;
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

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const daysWithPerfs = Array.from(perfByDate.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, perfs]) => ({ day, perfs }));

  const selectedPerfs = selectedDay ? perfByDate.get(selectedDay) || [] : [];
  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : "";

  function handleDaySelect(day: number) {
    setSelectedDay(selectedDay === day ? null : day);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[#131b2e]">
            {year}년 {getMonthName(month)}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
            오늘
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}>&lt;</Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>&gt;</Button>
        </div>
      </div>

      {/* Desktop: Calendar grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 text-center text-sm font-medium text-[#727785] mb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {cells.map((day, i) => (
            <CalendarCell
              key={i}
              year={year}
              month={month}
              day={day}
              performances={day ? perfByDate.get(day) || [] : []}
              isSelected={day === selectedDay}
              onSelect={handleDaySelect}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Selected day detail panel */}
      {selectedDay && selectedPerfs.length > 0 && (
        <div className="hidden md:block mt-6 bg-white rounded-lg p-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#131b2e]">
              {formatDate(selectedDateStr)} 공연 일정
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-[#727785] hover:text-[#131b2e] text-sm"
            >
              닫기 &times;
            </button>
          </div>
          <div className="space-y-3">
            {selectedPerfs.map((p) => (
              <Link
                key={p.id}
                href={`/performances/${p.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-[rgba(194,198,214,0.15)] hover:bg-[#f2f3ff]/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#131b2e] truncate">{p.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-[#424754]">
                    {p.artist?.name_ko && <span>{p.artist.name_ko}</span>}
                    {p.venue && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 10 12">
                          <path d="M5 0C2.24 0 0 2.24 0 5c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75c-.97 0-1.75-.78-1.75-1.75S4.03 3.25 5 3.25 6.75 4.03 6.75 5 5.97 6.75 5 6.75z" />
                        </svg>
                        {p.venue}
                      </span>
                    )}
                  </div>
                </div>
                <svg className="w-5 h-5 text-[#727785] shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: List view */}
      <div className="md:hidden space-y-3">
        {daysWithPerfs.length === 0 ? (
          <p className="text-sm text-[#424754] text-center py-8">
            이번 달 예정된 공연이 없습니다.
          </p>
        ) : (
          daysWithPerfs.map(({ day, perfs }) => (
            <div key={day} className="bg-white rounded-lg p-4">
              <p className="text-sm font-bold text-[#0058be] mb-2">
                {formatDate(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)}
              </p>
              <div className="space-y-2">
                {perfs.map((p) => (
                  <Link
                    key={p.id}
                    href={`/performances/${p.id}`}
                    className="block p-2 rounded hover:bg-[#f2f3ff]/50 transition-colors"
                  >
                    <p className="font-bold text-sm text-[#131b2e] truncate">{p.title}</p>
                    <p className="text-xs text-[#424754]">
                      {p.artist?.name_ko}{p.venue ? ` · ${p.venue}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
