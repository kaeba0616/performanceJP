import { TicketCountdown } from "@/components/performance/TicketCountdown";
import { SourceLinks } from "@/components/performance/SourceLinks";
import { createServerClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import type { PerformanceWithDetails } from "@/types";
import Link from "next/link";

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: "UPCOMING", className: "status-upcoming" },
  on_sale: { label: "ON SALE", className: "status-on-sale" },
  sold_out: { label: "SOLD OUT", className: "status-sold-out" },
  completed: { label: "종료", className: "status-completed" },
};

async function getPerformance(
  id: string
): Promise<PerformanceWithDetails | null> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("performances")
    .select("*, artist:artists(*), source_listings(*)")
    .eq("id", id)
    .single();

  return data as PerformanceWithDetails | null;
}

export default async function PerformanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const performance = await getPerformance(id);

  if (!performance) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#131b2e]">
          공연을 찾을 수 없습니다
        </h1>
        <Link href="/" className="text-[#0058be] mt-4 inline-block">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const status =
    statusConfig[performance.status] || statusConfig.upcoming;

  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-24 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <Link
          href="/"
          className="font-medium text-[#424754] hover:text-[#131b2e]"
        >
          홈
        </Link>
        <span className="text-[#c2c6d6]">&rsaquo;</span>
        <Link
          href="/"
          className="font-medium text-[#424754] hover:text-[#131b2e]"
        >
          콘서트
        </Link>
        <span className="text-[#c2c6d6]">&rsaquo;</span>
        <span className="font-medium text-[#131b2e] truncate max-w-xs">
          {performance.title}
        </span>
      </div>

      <div className="flex gap-12 items-start">
        {/* Left Column (2/3) */}
        <div className="flex-1 min-w-0 space-y-10">
          {/* Header */}
          <div>
            <span
              className={`${status.className} text-xs font-semibold uppercase tracking-[0.6px] px-3 py-1 rounded-xl inline-block mb-4`}
            >
              {status.label}
            </span>
            <h1 className="text-5xl font-extrabold text-[#131b2e] tracking-[-2.4px] leading-[48px] mb-4">
              {performance.title}
            </h1>
            {performance.artist && (
              <Link
                href={`/artists/${performance.artist.id}`}
                className="text-base font-semibold text-[#0058be] hover:underline inline-flex items-center gap-1"
              >
                {performance.artist.name_en || performance.artist.name_ko}
                {performance.artist.name_ko &&
                  performance.artist.name_en &&
                  ` (${performance.artist.name_ko})`}
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>

          {/* Info Grid */}
          <div className="bg-[#f2f3ff] rounded-lg p-8 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold text-[#727785] uppercase tracking-[1.2px] mb-1">
                CONCERT DATE
              </p>
              <p className="text-lg font-semibold text-[#131b2e]">
                {formatDate(performance.start_date)}
                {performance.end_date
                  ? ` ~ ${formatDate(performance.end_date)}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#727785] uppercase tracking-[1.2px] mb-1">
                VENUE
              </p>
              <p className="text-lg font-semibold text-[#131b2e]">
                {performance.venue || "-"}
                {performance.city ? `, ${performance.city}` : ""}
              </p>
            </div>
            {performance.ticket_open_at && (
              <div>
                <p className="text-xs font-semibold text-[#727785] uppercase tracking-[1.2px] mb-1">
                  TICKET OPEN
                </p>
                <p className="text-lg font-semibold text-[#131b2e]">
                  {formatDateTime(performance.ticket_open_at)}
                </p>
              </div>
            )}
            {performance.price_info && (
              <div>
                <p className="text-xs font-semibold text-[#727785] uppercase tracking-[1.2px] mb-1">
                  PRICE
                </p>
                <p className="text-lg font-semibold text-[#131b2e]">
                  {performance.price_info}
                </p>
              </div>
            )}
          </div>

          {/* Ticket Buttons */}
          <SourceLinks
            listings={performance.source_listings}
            size="large"
          />
        </div>

        {/* Right Column (1/3) */}
        <div className="w-[395px] shrink-0 space-y-8 hidden lg:block">
          {performance.ticket_open_at && (
            <TicketCountdown ticketOpenAt={performance.ticket_open_at} />
          )}
        </div>
      </div>
    </div>
  );
}
