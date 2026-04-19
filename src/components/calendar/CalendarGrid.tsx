"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, X, ArrowRight } from "lucide-react";
import { CalendarCell } from "./CalendarCell";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  formatDate,
} from "@/lib/utils/date";
import { normalizeSongs, type Performance } from "@/types";

function SetlistBadge({ setlist }: { setlist: unknown }) {
  const count = normalizeSongs(setlist).length;
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider">
      Setlist {count}
    </span>
  );
}

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
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  };

  const goToToday = () => {
    setSelectedDay(null);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="editorial-title-sm text-2xl md:text-3xl font-black text-on-surface">
            {year}년 {getMonthName(month)}
          </h2>
          <button
            onClick={goToToday}
            className="bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed-variant text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            오늘
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={goToPrevMonth}
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-primary-fixed text-on-surface-variant flex items-center justify-center transition-colors"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-primary-fixed text-on-surface-variant flex items-center justify-center transition-colors"
            aria-label="다음 달"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop: Calendar grid */}
      <div className="hidden md:block bg-surface-container-low rounded-3xl p-4">
        <div className="grid grid-cols-7 text-center text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 rounded-2xl overflow-hidden">
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
        <div className="hidden md:block mt-6 bg-surface-container-lowest rounded-3xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="editorial-title-sm text-xl font-black text-on-surface">
              {formatDate(selectedDateStr)} 공연 일정
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {selectedPerfs.map((p) => (
              <Link
                key={p.id}
                href={`/performances/${p.id}`}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low hover:bg-primary-fixed group transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-black text-on-surface truncate group-hover:text-on-primary-fixed-variant">
                    {p.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-on-surface-variant">
                    {p.artist?.name_ko && <span>{p.artist.name_ko}</span>}
                    {p.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {p.venue}
                      </span>
                    )}
                    <SetlistBadge setlist={p.setlist} />
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-on-surface-variant shrink-0 group-hover:text-on-primary-fixed-variant transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: List view */}
      <div className="md:hidden space-y-4">
        {daysWithPerfs.length === 0 ? (
          <div className="bg-surface-container-low rounded-3xl py-14 text-center">
            <p className="text-sm text-on-surface-variant">
              이번 달 예정된 공연이 없습니다.
            </p>
          </div>
        ) : (
          daysWithPerfs.map(({ day, perfs }) => (
            <div
              key={day}
              className="bg-surface-container-lowest rounded-2xl p-5"
            >
              <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">
                {formatDate(
                  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                )}
              </p>
              <div className="space-y-2">
                {perfs.map((p) => (
                  <Link
                    key={p.id}
                    href={`/performances/${p.id}`}
                    className="block p-3 -mx-2 rounded-xl hover:bg-primary-fixed/50 transition-colors"
                  >
                    <p className="font-black text-sm text-on-surface truncate">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-on-surface-variant">
                        {p.artist?.name_ko}
                        {p.venue ? ` · ${p.venue}` : ""}
                      </p>
                      <SetlistBadge setlist={p.setlist} />
                    </div>
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
