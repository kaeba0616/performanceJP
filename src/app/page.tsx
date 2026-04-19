import Link from "next/link";
import { Calendar, BellRing, Sparkles, Music } from "lucide-react";
import { PerformanceSection } from "@/components/home/PerformanceSection";
import { createServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/date";
import type { Performance } from "@/types";

async function getLandingData() {
  const supabase = createServerClient();
  const nowIso = new Date().toISOString();
  const todayIso = nowIso.split("T")[0];

  const [ticketOpening, onSale, upcoming, recent] = await Promise.all([
    supabase
      .from("performances")
      .select("*, artist:artists(*)")
      .not("ticket_open_at", "is", null)
      .gt("ticket_open_at", nowIso)
      .order("ticket_open_at", { ascending: true })
      .limit(6),
    supabase
      .from("performances")
      .select("*, artist:artists(*)")
      .eq("status", "on_sale")
      .gte("start_date", todayIso)
      .order("start_date", { ascending: true })
      .limit(6),
    supabase
      .from("performances")
      .select("*, artist:artists(*)")
      .in("status", ["upcoming", "on_sale"])
      .gte("start_date", todayIso)
      .order("start_date", { ascending: true })
      .limit(6),
    supabase
      .from("performances")
      .select("*, artist:artists(*)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return {
    ticketOpening: (ticketOpening.data as Performance[]) || [],
    onSale: (onSale.data as Performance[]) || [],
    upcoming: (upcoming.data as Performance[]) || [],
    recent: (recent.data as Performance[]) || [],
  };
}

export default async function HomePage() {
  const { ticketOpening, onSale, upcoming, recent } = await getLandingData();
  const hero = recent[0];
  const bentoImage = hero?.image_url || hero?.artist?.image_url || null;

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-16 md:pb-24">
      <div className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="editorial-title text-5xl md:text-6xl font-black text-primary mb-3 whitespace-nowrap">
            내한공연 트래커
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant font-medium">
            일본 아티스트의 한국 공연, 티켓팅과 공연일을 한눈에.
          </p>
        </div>
        <Link
          href="/calendar"
          className="self-start md:self-auto inline-flex items-center gap-2 bg-primary px-6 py-3.5 rounded-xl text-on-primary font-bold text-sm transition-all hover:bg-primary-container whitespace-nowrap"
        >
          <Calendar className="w-4 h-4" />
          달력으로 보기
        </Link>
      </div>

      <div className="space-y-16 md:space-y-24">
        <PerformanceSection
          title="🎫 곧 티켓 오픈"
          description="오픈 예정 티켓을 놓치지 마세요."
          performances={ticketOpening}
          moreHref="/calendar"
          emphasis="ticket"
          emptyLabel="예정된 티켓 오픈 정보가 없습니다."
        />

        <PerformanceSection
          title="🔥 현재 판매중"
          description="지금 바로 예매 가능한 공연."
          performances={onSale}
          moreHref="/calendar"
          emptyLabel="현재 판매중인 공연이 없습니다."
        />

        <section className="py-16 px-6 md:px-10 bg-surface-container-low rounded-3xl">
          <PerformanceSection
            title="📅 곧 다가오는 공연"
            description="일정이 임박한 공연을 먼저 확인하세요."
            performances={upcoming}
            moreHref="/calendar"
            emptyLabel="예정된 공연이 없습니다."
          />
        </section>

        <PerformanceSection
          title="✨ 최근 추가된 공연"
          description="새로 등록된 공연 소식."
          performances={recent}
          moreHref="/calendar"
          emptyLabel="최근 등록된 공연이 없습니다."
        />

        {/* Bento Grid — Feature block */}
        <section>
          <div className="mb-8">
            <h2 className="editorial-title text-3xl md:text-4xl font-black text-on-surface mb-2">
              🌊 THE PULSE
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base">
              J-Rock · J-Pop 문화를 큐레이팅합니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-6 md:h-[560px]">
            {/* Hero tile */}
            {hero ? (
              <Link
                href={`/performances/${hero.id}`}
                className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden group bg-surface-container-high min-h-[300px]"
              >
                {bentoImage ? (
                  <img
                    src={bentoImage}
                    alt={hero.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent flex flex-col justify-end p-8">
                  <span className="bg-on-primary text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase w-fit mb-4">
                    Newly Added
                  </span>
                  <h3 className="editorial-title text-3xl md:text-4xl font-black text-on-primary mb-2 line-clamp-2">
                    {hero.title}
                  </h3>
                  <p className="text-on-primary/80 mb-6 text-sm font-medium">
                    {hero.venue ? `${hero.venue} · ` : ""}
                    {formatDate(hero.start_date)}
                  </p>
                  <span className="w-fit bg-on-primary text-primary px-5 py-2.5 rounded-xl font-black text-sm">
                    공연 상세 보기 →
                  </span>
                </div>
              </Link>
            ) : (
              <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim flex items-end p-8 min-h-[300px]">
                <div>
                  <span className="bg-on-primary text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase inline-block mb-4">
                    Coming Soon
                  </span>
                  <h3 className="editorial-title text-3xl md:text-4xl font-black text-on-primary">
                    새로운 공연을 기다리는 중
                  </h3>
                </div>
              </div>
            )}

            {/* Tagline card */}
            <div className="md:col-span-2 md:row-span-1 bg-surface-container-high rounded-3xl p-8 flex flex-col justify-between min-h-[180px]">
              <div className="flex justify-between items-start">
                <div className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Editor&apos;s Note
                </div>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="editorial-title-sm text-xl md:text-2xl font-black text-on-surface mb-2">
                  셋리스트부터 티켓 오픈까지, 한 곳에서.
                </h4>
                <p className="text-on-surface-variant text-sm">
                  아티스트별 대표곡과 공연 셋리스트를 함께 확인하세요.
                </p>
              </div>
            </div>

            {/* Artists tile */}
            <Link
              href="/artists"
              className="md:col-span-1 md:row-span-1 bg-surface-container-highest rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:bg-primary-fixed transition-colors min-h-[140px]"
            >
              <Music className="w-8 h-8 text-primary mb-3" />
              <h5 className="editorial-title-sm font-black text-on-surface">아티스트</h5>
              <p className="text-xs text-on-surface-variant mt-1">
                일본 아티스트 모아보기
              </p>
            </Link>

            {/* Subscribe tile */}
            <Link
              href="/subscribe"
              className="md:col-span-1 md:row-span-1 bg-primary text-on-primary rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:bg-primary-container transition-colors min-h-[140px] group"
            >
              <BellRing className="w-8 h-8 mb-3 transition-transform group-hover:scale-110" />
              <h5 className="editorial-title-sm font-black">알림 설정</h5>
              <p className="text-xs text-on-primary/80 mt-1">티켓 오픈 알림받기</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
