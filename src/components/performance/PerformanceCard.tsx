import Link from "next/link";
import { formatDate } from "@/lib/utils/date";
import type { Performance } from "@/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: "UPCOMING", className: "status-upcoming" },
  on_sale: { label: "ON SALE", className: "status-on-sale" },
  sold_out: { label: "SOLD OUT", className: "status-sold-out" },
  completed: { label: "종료", className: "status-completed" },
};

export function PerformanceCard({
  performance,
}: {
  performance: Performance;
}) {
  const status = statusConfig[performance.status] || statusConfig.upcoming;
  const isSoldOut = performance.status === "sold_out" || performance.status === "completed";

  return (
    <Link href={`/performances/${performance.id}`}>
      <div
        className={`bg-white rounded-lg p-6 hover:shadow-md transition-shadow relative ${
          isSoldOut ? "opacity-80" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <span
            className={`${status.className} text-xs font-bold uppercase tracking-[1.2px] px-3 py-1 rounded-xl`}
          >
            {status.label}
          </span>
          <span className={`text-sm font-bold ${isSoldOut ? "text-[#424754]" : "text-[#0058be]"}`}>
            {formatDate(performance.start_date)}
          </span>
        </div>

        <h4 className={`text-xl font-bold mb-2 line-clamp-2 ${isSoldOut ? "text-[#424754]" : "text-[#131b2e]"}`}>
          {performance.title}
        </h4>

        {performance.venue && (
          <div className="flex items-center gap-1 mb-4">
            <svg className="w-[10px] h-[12px] text-[#424754] shrink-0" fill="currentColor" viewBox="0 0 10 12">
              <path d="M5 0C2.24 0 0 2.24 0 5c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75c-.97 0-1.75-.78-1.75-1.75S4.03 3.25 5 3.25 6.75 4.03 6.75 5 5.97 6.75 5 6.75z" />
            </svg>
            <span className="text-sm text-[#424754]">{performance.venue}</span>
          </div>
        )}

        <div className="border-t border-[rgba(194,198,214,0.15)] pt-4 flex items-center justify-between">
          <div>
            {performance.price_info && (
              <>
                <p className="text-sm text-[#424754]">
                  {performance.price_info.split("/")[0]?.split("원")[0] ? "가격 정보" : ""}
                </p>
                <p className={`text-lg font-semibold ${isSoldOut ? "text-[#424754]" : "text-[#131b2e]"}`}>
                  {performance.price_info.length > 20
                    ? performance.price_info.split("/")[0].trim()
                    : performance.price_info}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
