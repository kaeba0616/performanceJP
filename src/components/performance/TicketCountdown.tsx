"use client";

import { useState, useEffect } from "react";

export function TicketCountdown({ ticketOpenAt }: { ticketOpenAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const target = new Date(ticketOpenAt).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("오픈됨");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}일`);
      parts.push(`${String(hours).padStart(2, "0")}시간`);
      parts.push(`${String(minutes).padStart(2, "0")}분`);
      parts.push(`${String(seconds).padStart(2, "0")}초`);

      setTimeLeft(parts.join(" "));
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [ticketOpenAt]);

  return (
    <div className="rounded-lg border bg-primary/5 p-4 text-center">
      <p className="text-sm text-muted-foreground mb-1">티켓 오픈까지</p>
      <p className="text-2xl font-bold tabular-nums">{timeLeft}</p>
    </div>
  );
}
