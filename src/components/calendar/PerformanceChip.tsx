"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Performance } from "@/types";

const statusColors: Record<Performance["status"], string> = {
  upcoming: "bg-blue-100 text-blue-800",
  on_sale: "bg-green-100 text-green-800",
  sold_out: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<Performance["status"], string> = {
  upcoming: "예정",
  on_sale: "판매중",
  sold_out: "매진",
  completed: "종료",
};

export function PerformanceChip({
  performance,
}: {
  performance: Performance;
}) {
  return (
    <Link
      href={`/performances/${performance.id}`}
      className="block text-xs truncate rounded px-1.5 py-0.5 hover:opacity-80 transition-opacity bg-primary/10 text-primary"
      title={performance.title}
    >
      <span className="font-medium">
        {performance.artist?.name_ko || performance.title}
      </span>
      <Badge
        variant="outline"
        className={`ml-1 text-[10px] px-1 py-0 ${statusColors[performance.status]}`}
      >
        {statusLabels[performance.status]}
      </Badge>
    </Link>
  );
}
