import Link from "next/link";
import { ChevronRight, MapPin, CalendarDays, Ticket, Wallet, ExternalLink } from "lucide-react";
import { TicketCountdown } from "@/components/performance/TicketCountdown";
import { SourceLinks } from "@/components/performance/SourceLinks";
import { AttendanceButton } from "@/components/performance/AttendanceButton";
import { SetlistSection } from "@/components/submission/SetlistSection";
import { LineupGrid } from "@/components/performance/LineupGrid";
import { createServiceClient, createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatDateTime, formatShowTime } from "@/lib/utils/date";
import { isStartedKST } from "@/lib/utils/kst";
import { normalizeShowTimes, normalizeSongs, type PerformanceWithDetails } from "@/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: "UPCOMING", className: "status-upcoming" },
  on_sale: { label: "ON SALE", className: "status-on-sale" },
  sold_out: { label: "SOLD OUT", className: "status-sold-out" },
  completed: { label: "종료", className: "status-completed" },
};

async function getPerformance(
  id: string
): Promise<PerformanceWithDetails | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("performances")
    .select(
      "*, artist:artists!performances_artist_id_fkey(*), source_listings(*), performance_artists(display_order, artist:artists(*))"
    )
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

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initialAttended = false;
  if (user && performance) {
    const { data } = await supabase
      .from("user_attendances")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("performance_id", id)
      .maybeSingle();
    initialAttended = !!data;
  }

  if (!performance) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="editorial-title text-3xl font-black text-on-surface">
          공연을 찾을 수 없습니다
        </h1>
        <Link
          href="/"
          className="text-primary font-bold mt-4 inline-block hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const status = statusConfig[performance.status] || statusConfig.upcoming;
  const image = performance.image_url || performance.artist?.image_url || null;
  const setlistSongs = normalizeSongs(performance.setlist);
  const showTimes = normalizeShowTimes(performance.show_times);
  const canStamp = isStartedKST(performance.start_date);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-8 pb-20">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs mb-8 text-on-surface-variant font-medium">
        <Link href="/" className="hover:text-primary transition-colors">
          홈
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/calendar" className="hover:text-primary transition-colors">
          공연
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-on-surface font-bold truncate max-w-xs">
          {performance.title}
        </span>
      </nav>

      {/* Hero: 포스터(왼쪽) + 제목/일정/장소/가격(오른쪽) */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[360px_1fr] gap-8 lg:gap-10 items-start mb-12">
        {/* Poster */}
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-surface-container-high">
          {image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={performance.title}
                className="relative w-full h-full object-contain"
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim flex items-center justify-center">
              <span className="editorial-title text-5xl md:text-7xl font-black italic text-on-primary/30 tracking-tighter">
                THE PULSE
              </span>
            </div>
          )}
          <span
            className={`${status.className} absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase z-10`}
          >
            {status.label}
          </span>
        </div>

        {/* Info column */}
        <div className="min-w-0 space-y-6">
          <h1 className="editorial-title text-3xl md:text-4xl lg:text-5xl font-black text-on-surface leading-tight">
            {performance.title}
          </h1>

          <div className="bg-surface-container-low rounded-3xl p-5 md:p-6 space-y-5">
            <InfoItem
              icon={<CalendarDays className="w-4 h-4" />}
              label="Concert Date"
            >
              {(() => {
                if (showTimes.length > 0) {
                  return (
                    <span className="block space-y-1">
                      {showTimes.map((s, i) => (
                        <span key={i} className="block">
                          {formatShowTime(s.datetime)}
                        </span>
                      ))}
                    </span>
                  );
                }
                const startStr = performance.start_time
                  ? formatShowTime(
                      `${performance.start_date}T${String(performance.start_time).slice(0, 5)}`
                    )
                  : formatDate(performance.start_date);
                if (!performance.end_date || performance.end_date === performance.start_date) {
                  return startStr;
                }
                const endStr = performance.end_time
                  ? formatShowTime(
                      `${performance.end_date}T${String(performance.end_time).slice(0, 5)}`
                    )
                  : formatDate(performance.end_date);
                return `${startStr} ~ ${endStr}`;
              })()}
            </InfoItem>
            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Venue">
              {performance.venue ? (
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(
                    [performance.venue, performance.city].filter(Boolean).join(" ")
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-baseline gap-1.5 hover:text-primary underline-offset-4 hover:underline transition-colors"
                  title="네이버 지도에서 검색"
                >
                  <span>
                    {performance.venue}
                    {performance.city ? `, ${performance.city}` : ""}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 self-center text-on-surface-variant" />
                </a>
              ) : (
                "-"
              )}
            </InfoItem>
            {performance.ticket_open_at && (
              <InfoItem
                icon={<Ticket className="w-4 h-4" />}
                label="Ticket Open"
              >
                {formatDateTime(performance.ticket_open_at)}
              </InfoItem>
            )}
            {performance.price_info && (
              <InfoItem
                icon={<Wallet className="w-4 h-4" />}
                label="Price"
              >
                {performance.price_info}
              </InfoItem>
            )}
          </div>

          {performance.ticket_open_at && (
            <TicketCountdown ticketOpenAt={performance.ticket_open_at} />
          )}

          <SourceLinks listings={performance.source_listings} size="large" />

          {canStamp && (
            <AttendanceButton
              performanceId={performance.id}
              initialAttended={initialAttended}
              isLoggedIn={!!user}
              pathname={`/performances/${performance.id}`}
            />
          )}
        </div>
      </div>

      {/* 아래: 전체 폭 섹션 */}
      <div className="space-y-10">
        {/* Lineup */}
        {performance.performance_artists &&
          performance.performance_artists.length > 0 && (() => {
            const sortedPa = [...performance.performance_artists].sort(
              (a, b) => a.display_order - b.display_order
            );
            const anyWithDates = sortedPa.some(
              (pa) => Array.isArray(pa.show_dates) && pa.show_dates.length > 0
            );

            if (!anyWithDates) {
              return (
                <div>
                  <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">
                    라인업
                  </p>
                  <LineupGrid items={sortedPa.map((pa) => ({ artist: pa.artist }))} />
                </div>
              );
            }

            const byDate = new Map<string, typeof sortedPa>();
            const allDays: (typeof sortedPa)[number][] = [];
            for (const pa of sortedPa) {
              if (Array.isArray(pa.show_dates) && pa.show_dates.length > 0) {
                for (const d of pa.show_dates) {
                  const list = byDate.get(d) ?? [];
                  list.push(pa);
                  byDate.set(d, list);
                }
              } else {
                allDays.push(pa);
              }
            }
            const dateKeys = [...byDate.keys()].sort();

            return (
              <div className="space-y-6">
                <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest">
                  라인업
                </p>
                {dateKeys.map((d) => (
                  <div key={d}>
                    <p className="text-sm font-black text-primary mb-3">
                      {formatDate(d)}
                    </p>
                    <LineupGrid items={byDate.get(d)!.map((pa) => ({ artist: pa.artist }))} />
                  </div>
                ))}
                {allDays.length > 0 && (
                  <div>
                    <p className="text-sm font-black text-on-surface-variant mb-3">
                      전체 일자
                    </p>
                    <LineupGrid items={allDays.map((pa) => ({ artist: pa.artist }))} />
                  </div>
                )}
              </div>
            );
          })()}

        {/* Setlist + 비어있을 때만 제보 버튼/폼 */}
        <SetlistSection
          performanceId={performance.id}
          performanceTitle={performance.title}
          songs={setlistSongs}
        />
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2">
        {icon}
        {label}
      </div>
      <p className="text-lg font-black text-on-surface">{children}</p>
    </div>
  );
}
