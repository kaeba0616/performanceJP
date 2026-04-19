"use client";

import { useState, useEffect } from "react";
import { Info, BellRing } from "lucide-react";

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
      <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
        <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-3">
          Ticket Open
        </p>
        <p className="editorial-title text-4xl font-black text-secondary">
          오픈됨
        </p>
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
    <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8">
      <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest text-center mb-6">
        티켓 오픈까지
      </p>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {units.map((u) => (
          <div key={u.label} className="flex flex-col items-center">
            <span className="editorial-title text-3xl md:text-4xl font-black text-primary tabular-nums leading-tight">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-1">
              {u.label}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-primary-fixed/60 rounded-2xl p-4 flex gap-3 items-start mb-6">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-on-primary-fixed-variant leading-5 font-medium">
          티켓 오픈 15분 전 알림을 받으려면 구독 페이지에서 이메일을 등록하세요.
        </p>
      </div>
      <a
        href="/subscribe"
        className="w-full py-4 rounded-xl text-on-primary font-black text-sm text-center bg-gradient-to-br from-primary to-primary-container hover:brightness-110 transition-all flex items-center justify-center gap-2"
      >
        <BellRing className="w-4 h-4" />
        알림 신청하기
      </a>
    </div>
  );
}
