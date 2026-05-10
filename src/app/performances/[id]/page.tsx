import Link from "next/link";
import { ChevronRight, MapPin, CalendarDays, Ticket, Wallet, ArrowRight } from "lucide-react";
import { TicketCountdown } from "@/components/performance/TicketCountdown";
import { SourceLinks } from "@/components/performance/SourceLinks";
import { AttendanceButton } from "@/components/performance/AttendanceButton";
import { SongList } from "@/components/SongList";
import { createServiceClient, createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { isStartedKST } from "@/lib/utils/kst";
import { normalizeSongs, type PerformanceWithDetails } from "@/types";

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

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start">
        {/* Left Column */}
        <div className="min-w-0 space-y-8">
          {/* Hero Image */}
          <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-surface-container-high">
            {image ? (
              <img
                src={image}
                alt={performance.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim flex items-center justify-center">
                <span className="editorial-title text-5xl md:text-7xl font-black italic text-on-primary/30 tracking-tighter">
                  THE PULSE
                </span>
              </div>
            )}
            <span
              className={`${status.className} absolute top-6 left-6 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase`}
            >
              {status.label}
            </span>
          </div>

          {/* Header */}
          <div>
            <h1 className="editorial-title text-4xl md:text-5xl font-black text-on-surface leading-tight mb-3">
              {performance.title}
            </h1>
            {performance.artist && (
              <Link
                href={`/artists/${performance.artist.id}`}
                className="inline-flex items-center gap-1.5 text-base font-bold text-primary hover:underline"
              >
                {performance.artist.name_en || performance.artist.name_ko}
                {performance.artist.name_ko &&
                  performance.artist.name_en &&
                  ` · ${performance.artist.name_ko}`}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Info Grid */}
          <div className="bg-surface-container-low rounded-3xl p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <InfoItem
              icon={<CalendarDays className="w-4 h-4" />}
              label="Concert Date"
            >
              {formatDate(performance.start_date)}
              {performance.end_date
                ? ` ~ ${formatDate(performance.end_date)}`
                : ""}
            </InfoItem>
            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Venue">
              {performance.venue || "-"}
              {performance.city ? `, ${performance.city}` : ""}
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

          {/* Lineup (페스티벌 또는 라인업이 2명 이상인 경우) */}
          {performance.type === "festival" &&
            performance.performance_artists &&
            performance.performance_artists.length > 0 && (
              <div>
                <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">
                  라인업
                </p>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...performance.performance_artists]
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((pa) => (
                      <li key={pa.artist.id}>
                        <Link
                          href={`/artists/${pa.artist.id}`}
                          className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3 hover:bg-surface-container transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                            {pa.artist.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={pa.artist.image_url}
                                alt={pa.artist.name_ko}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-black text-primary/50">
                                {pa.artist.name_ko.slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-on-surface truncate">
                              {pa.artist.name_ko}
                            </p>
                            {pa.artist.name_en && (
                              <p className="text-xs text-on-surface-variant truncate">
                                {pa.artist.name_en}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            )}

          {/* Ticket Buttons */}
          <SourceLinks listings={performance.source_listings} size="large" />

          {/* Setlist */}
          <SongList
            songs={setlistSongs}
            title="셋리스트"
            emptyLabel="공연 후 셋리스트가 등록될 예정입니다."
          />
        </div>

        {/* Right Column */}
        <div className="lg:sticky lg:top-24 space-y-6">
          {canStamp && (
            <AttendanceButton
              performanceId={performance.id}
              initialAttended={initialAttended}
              isLoggedIn={!!user}
              pathname={`/performances/${performance.id}`}
            />
          )}

          {performance.ticket_open_at && (
            <TicketCountdown ticketOpenAt={performance.ticket_open_at} />
          )}

          {performance.artist && (
            <Link
              href={`/artists/${performance.artist.id}`}
              className="block bg-surface-container-lowest rounded-3xl p-6 hover:bg-primary-fixed group transition-colors"
            >
              <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">
                Artist
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-fixed group-hover:bg-on-primary flex items-center justify-center text-xl font-black text-primary shrink-0 overflow-hidden">
                  {performance.artist.image_url ? (
                    <img
                      src={performance.artist.image_url}
                      alt={performance.artist.name_ko}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    performance.artist.name_ko[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="editorial-title-sm font-black text-on-surface group-hover:text-on-primary-fixed-variant truncate">
                    {performance.artist.name_en || performance.artist.name_ko}
                  </p>
                  <p className="text-sm text-on-surface-variant truncate">
                    {performance.artist.name_ko}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-on-surface-variant group-hover:text-on-primary-fixed-variant shrink-0" />
              </div>
            </Link>
          )}
        </div>
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
