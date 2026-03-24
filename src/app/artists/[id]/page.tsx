import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getArtistWithPerformances(id: string) {
  const supabase = createServerClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (!artist) return null;

  const { data: performances } = await supabase
    .from("performances")
    .select("*")
    .eq("artist_id", id)
    .order("start_date", { ascending: true });

  return { artist, performances: performances || [] };
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
