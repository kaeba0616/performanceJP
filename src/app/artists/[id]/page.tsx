import { PerformanceCard } from "@/components/performance/PerformanceCard";
import Link from "next/link";
import type { Artist, Performance } from "@/types";

// TODO: Replace with Supabase query
async function getArtistWithPerformances(id: string): Promise<{
  artist: Artist;
  performances: Performance[];
} | null> {
  return {
    artist: {
      id,
      name_ko: "요아소비",
      name_ja: "YOASOBI",
      name_en: "YOASOBI",
      image_url: null,
      created_at: new Date().toISOString(),
    },
    performances: [
      {
        id: "1",
        artist_id: id,
        title: "YOASOBI ASIA TOUR 2026 in KOREA",
        venue: "KSPO DOME",
        city: "서울",
        start_date: "2026-04-15",
        end_date: "2026-04-16",
        ticket_open_at: "2026-04-10T20:00:00+09:00",
        presale_open_at: null,
        price_info: "VIP 198,000원 / R석 154,000원",
        status: "upcoming",
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  };
}

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getArtistWithPerformances(id);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">아티스트를 찾을 수 없습니다</h1>
        <Link href="/artists" className="text-primary mt-4 inline-block">
          아티스트 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { artist, performances } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/artists"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        &larr; 아티스트 목록
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
          {artist.name_ko[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{artist.name_ko}</h1>
          <p className="text-muted-foreground">
            {[artist.name_en, artist.name_ja].filter(Boolean).join(" / ")}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">공연 일정</h2>
      {performances.length === 0 ? (
        <p className="text-muted-foreground">예정된 공연이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {performances.map((p) => (
            <PerformanceCard key={p.id} performance={p} />
          ))}
        </div>
      )}
    </div>
  );
}
