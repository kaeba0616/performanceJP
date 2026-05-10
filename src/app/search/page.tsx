import Link from "next/link";
import { SearchX } from "lucide-react";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { createServiceClient } from "@/lib/supabase/server";
import type { Performance } from "@/types";

async function searchArtists(query: string) {
  const supabase = createServiceClient();
  const pattern = `%${query}%`;

  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .or(
      `name_ko.ilike.${pattern},name_en.ilike.${pattern},name_ja.ilike.${pattern}`
    );

  if (!artists || artists.length === 0) return [];

  const artistIds = artists.map((a) => a.id);
  const { data: performances } = await supabase
    .from("performances")
    .select("*, artist:artists!performances_artist_id_fkey(*), source_listings(*)")
    .in("artist_id", artistIds)
    .order("start_date", { ascending: true });

  return artists.map((artist) => ({
    artist,
    performances: ((performances || []) as Performance[]).filter(
      (p) => p.artist_id === artist.id
    ),
  }));
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const results = query ? await searchArtists(query) : [];
  const totalPerformances = results.reduce(
    (acc, r) => acc + r.performances.length,
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-24">
      <div className="mb-12">
        <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">
          Search Results
        </p>
        <h1 className="editorial-title text-4xl md:text-5xl font-black text-on-surface mb-3">
          {query ? `"${query}"` : "검색"}
        </h1>
        {query && (
          <p className="text-on-surface-variant font-medium">
            아티스트 {results.length}명 · 공연 {totalPerformances}건
          </p>
        )}
      </div>

      {!query && (
        <div className="bg-surface-container-low rounded-3xl py-16 flex flex-col items-center text-center">
          <SearchX className="w-10 h-10 text-outline-variant mb-3" />
          <p className="text-on-surface-variant">검색어를 입력해주세요.</p>
        </div>
      )}

      {query && results.length === 0 && (
        <div className="bg-surface-container-low rounded-3xl py-16 flex flex-col items-center text-center">
          <SearchX className="w-10 h-10 text-outline-variant mb-3" />
          <p className="editorial-title-sm text-xl font-black text-on-surface mb-1">
            결과가 없습니다
          </p>
          <p className="text-sm text-on-surface-variant">
            다른 이름으로 검색해 보세요.
          </p>
        </div>
      )}

      <div className="space-y-14">
        {results.map(({ artist, performances }) => (
          <section key={artist.id}>
            {/* Artist header */}
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center overflow-hidden shrink-0">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name_ko}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="editorial-title text-3xl font-black italic text-primary tracking-tighter">
                    {artist.name_ko[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/artists/${artist.id}`}
                  className="editorial-title-sm text-2xl md:text-3xl font-black text-on-surface hover:text-primary transition-colors truncate block"
                >
                  {artist.name_en || artist.name_ko}
                </Link>
                <p className="text-sm text-on-surface-variant">
                  {artist.name_ko}
                  {artist.name_ja && artist.name_ja !== artist.name_en
                    ? ` · ${artist.name_ja}`
                    : ""}
                </p>
              </div>
            </div>

            {/* Concert cards grid */}
            {performances.length === 0 ? (
              <div className="bg-surface-container-low rounded-2xl py-10 text-center">
                <p className="text-sm text-on-surface-variant">
                  예정된 공연이 없습니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {performances.map((perf) => (
                  <PerformanceCard key={perf.id} performance={perf} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
