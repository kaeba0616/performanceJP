"use client";

import type { Performance } from "@/types";

const statusConfig: Record<string, { className: string }> = {
  upcoming: {
    className: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  on_sale: {
    className: "bg-secondary-container text-on-secondary-container",
  },
  sold_out: {
    className: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  },
  completed: {
    className: "bg-surface-container-highest text-on-surface-variant",
  },
};

export function PerformanceChip({
  performance,
}: {
  performance: Performance;
}) {
  const status = statusConfig[performance.status] || statusConfig.upcoming;

  return (
    <span
      className={`block text-[10px] font-black truncate rounded-md px-1.5 py-0.5 ${status.className}`}
      title={performance.title}
    >
      {performance.artist?.name_ko || performance.title}
    </span>
  );
}
