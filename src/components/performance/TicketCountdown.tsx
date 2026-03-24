"use client";

import { useState, useEffect } from "react";

interface TimeUnits {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

export function TicketCountdown({ ticketOpenAt }: { ticketOpenAt: string }) {
  const [time, setTime] = useState<TimeUnits | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    function update() {
      const target = new Date(ticketOpenAt).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setOpened(true);
        return;
      }

      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [ticketOpenAt]);

  if (opened) {
    return (
      <div className="bg-white border border-[rgba(194,198,214,0.15)] rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-8 text-center">
        <p className="text-sm font-bold text-[#424754] uppercase tracking-[1.4px] mb-4">
          티켓 오픈까지
        </p>
        <p className="text-3xl font-extrabold text-[#00714d]">오픈됨</p>
      </div>
    );
  }

  if (!time) return null;

  const units: { value: number; label: string }[] = [
    { value: time.days, label: "DAYS" },
    { value: time.hours, label: "HOURS" },
    { value: time.mins, label: "MINS" },
    { value: time.secs, label: "SECS" },
  ];

  return (
    <div className="bg-white border border-[rgba(194,198,214,0.15)] rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-8">
      <p className="text-sm font-bold text-[#424754] uppercase tracking-[1.4px] text-center mb-6">
        티켓 오픈까지
      </p>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {units.map((u) => (
          <div key={u.label} className="flex flex-col items-center">
            <span className="text-4xl font-extrabold text-[#0058be] tabular-nums leading-tight">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-semibold text-[#c2c6d6] uppercase tracking-[-0.5px]">
              {u.label}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-[rgba(0,88,190,0.05)] rounded p-4 flex gap-3 items-start mb-6">
        <svg className="w-5 h-5 text-[#0058be] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-xs text-[#424754] leading-[18px]">
          브라우저 알림 설정을 켜두시면 티켓 오픈 15분 전에 푸시 알림을 보내드립니다.
        </p>
      </div>
      <button className="w-full py-4 rounded-md text-white font-bold text-base text-center bg-gradient-to-br from-[#0058be] to-[#2170e4] shadow-[0px_10px_15px_-3px_rgba(0,88,190,0.2),0px_4px_6px_-4px_rgba(0,88,190,0.2)] hover:brightness-110 transition-all">
        알림 신청하기
      </button>
    </div>
  );
}
