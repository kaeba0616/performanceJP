import { Badge } from "@/components/ui/badge";
import { TicketCountdown } from "@/components/performance/TicketCountdown";
import { SourceLinks } from "@/components/performance/SourceLinks";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import type { PerformanceWithDetails } from "@/types";
import Link from "next/link";

// TODO: Replace with Supabase query
async function getPerformance(id: string): Promise<PerformanceWithDetails | null> {
  // Placeholder
  return {
    id,
    artist_id: "a1",
    title: "YOASOBI ASIA TOUR 2026 in KOREA",
    venue: "KSPO DOME",
    city: "서울",
    start_date: "2026-04-15",
    end_date: "2026-04-16",
    ticket_open_at: "2026-04-10T20:00:00+09:00",
    presale_open_at: null,
    price_info: "VIP 198,000원 / R석 154,000원 / S석 110,000원",
    status: "upcoming",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    artist: {
      id: "a1",
      name_ko: "요아소비",
      name_ja: "YOASOBI",
      name_en: "YOASOBI",
      image_url: null,
      created_at: new Date().toISOString(),
    },
    source_listings: [
      {
        id: "s1",
        performance_id: id,
        source: "yes24",
        source_url: "https://ticket.yes24.com/example",
        source_id: "12345",
        raw_title: "YOASOBI ASIA TOUR 2026 in KOREA",
        raw_data: {},
        ticket_open_at: "2026-04-10T20:00:00+09:00",
        price_info: null,
        last_crawled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "s2",
        performance_id: id,
        source: "interpark",
        source_url: "https://tickets.interpark.com/example",
        source_id: "67890",
        raw_title: "YOASOBI ASIA TOUR 2026 in KOREA",
        raw_data: {},
        ticket_open_at: "2026-04-10T20:00:00+09:00",
        price_info: null,
        last_crawled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ],
  };
}

const statusLabel: Record<string, string> = {
  upcoming: "예정",
  on_sale: "판매중",
  sold_out: "매진",
  completed: "종료",
};

export default async function PerformanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const performance = await getPerformance(id);

  if (!performance) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">공연을 찾을 수 없습니다</h1>
        <Link href="/" className="text-primary mt-4 inline-block">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        &larr; 캘린더로 돌아가기
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main info */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge>{statusLabel[performance.status]}</Badge>
              {performance.artist && (
                <Link
                  href={`/artists/${performance.artist.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {performance.artist.name_ko}
                </Link>
              )}
            </div>
            <h1 className="text-2xl font-bold">{performance.title}</h1>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex gap-2">
              <span className="font-medium w-20 shrink-0">공연일</span>
              <span>
                {formatDate(performance.start_date)}
                {performance.end_date
                  ? ` ~ ${formatDate(performance.end_date)}`
                  : ""}
              </span>
            </div>
            {performance.venue && (
              <div className="flex gap-2">
                <span className="font-medium w-20 shrink-0">장소</span>
                <span>
                  {performance.venue}, {performance.city}
                </span>
              </div>
            )}
            {performance.ticket_open_at && (
              <div className="flex gap-2">
                <span className="font-medium w-20 shrink-0">티켓 오픈</span>
                <span>{formatDateTime(performance.ticket_open_at)}</span>
              </div>
            )}
            {performance.price_info && (
              <div className="flex gap-2">
                <span className="font-medium w-20 shrink-0">가격</span>
                <span>{performance.price_info}</span>
              </div>
            )}
          </div>

          <SourceLinks listings={performance.source_listings} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {performance.ticket_open_at &&
            performance.status === "upcoming" && (
              <TicketCountdown ticketOpenAt={performance.ticket_open_at} />
            )}
        </div>
      </div>
    </div>
  );
}
