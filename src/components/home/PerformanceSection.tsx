import Link from "next/link";
import { SearchX, Ticket } from "lucide-react";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { formatDateTime, getTimeUntil } from "@/lib/utils/date";
import type { Performance } from "@/types";

interface PerformanceSectionProps {
  title: string;
  description?: string;
  performances: Performance[];
  moreHref: string;
  moreLabel?: string;
  emphasis?: "ticket";
  emptyLabel?: string;
}

export function PerformanceSection({
  title,
  description,
  performances,
  moreHref,
  moreLabel = "더보기",
  emphasis,
  emptyLabel = "조건에 맞는 공연이 없습니다.",
}: PerformanceSectionProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h2 className="editorial-title text-3xl md:text-4xl font-black text-on-surface mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-on-surface-variant text-sm md:text-base">
              {description}
            </p>
          )}
        </div>
        <Link
          href={moreHref}
          className="shrink-0 text-primary font-extrabold text-sm md:text-base hover:underline transition-all whitespace-nowrap"
        >
          {moreLabel} →
        </Link>
      </div>

      {performances.length === 0 ? (
        <div className="bg-surface-container-low rounded-3xl py-16 flex flex-col items-center text-center">
          <SearchX className="w-10 h-10 text-outline-variant mb-3" />
          <p className="text-on-surface-variant text-sm">{emptyLabel}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {performances.map((performance) => (
            <div key={performance.id} className="flex flex-col">
              {emphasis === "ticket" && performance.ticket_open_at && (
                <div className="bg-primary-container text-white px-4 py-2 rounded-t-2xl text-[11px] font-bold tracking-widest uppercase flex items-center gap-2 -mb-2">
                  <Ticket className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    티켓 오픈 {formatDateTime(performance.ticket_open_at)}
                  </span>
                  <span className="ml-auto opacity-80 normal-case tracking-normal font-medium">
                    {getTimeUntil(performance.ticket_open_at)}
                  </span>
                </div>
              )}
              <div className={emphasis === "ticket" ? "[&>a]:rounded-t-none" : ""}>
                <PerformanceCard performance={performance} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
