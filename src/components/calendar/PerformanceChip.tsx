"use client";

import type { Performance } from "@/types";

const statusConfig: Record<string, { className: string }> = {
  upcoming: { className: "bg-[#2170e4] text-white" },
  on_sale: { className: "bg-[#6cf8bb] text-[#00714d]" },
  sold_out: { className: "bg-[#da3437] text-white" },
  completed: { className: "bg-[#c2c6d6] text-white" },
};

export function PerformanceChip({
  performance,
}: {
  performance: Performance;
}) {
  const status = statusConfig[performance.status] || statusConfig.upcoming;

  return (
    <span
      className={`block text-[10px] font-bold truncate rounded-sm px-1.5 py-0.5 ${status.className}`}
      title={performance.title}
    >
      {performance.artist?.name_ko || performance.title}
    </span>
  );
}
