import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { normalizeSongs } from "@/types";

const gradients = [
  "from-primary via-primary-container to-primary-fixed-dim",
  "from-primary-container via-primary-fixed-dim to-primary-fixed",
  "from-secondary via-secondary-container to-secondary-fixed",
  "from-tertiary-fixed-dim via-tertiary-fixed to-primary-fixed",
  "from-primary-fixed via-secondary-fixed-dim to-primary-fixed-dim",
  "from-primary-container to-primary-fixed-dim",
];

async function getArtists() {
  const supabase = createServerClient();

  const { data: artists } = await supabase
    .from("artists")
    .select("*, performances(count)")
    .order("name_ko");

  return (artists || []).map((a) => ({
    ...a,
    performanceCount:
      (a.performances as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));
}

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-24">
      <div className="mb-12">
        <h1 className="editorial-title text-4xl md:text-5xl font-black text-primary mb-3 whitespace-nowrap">
          아티스트
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant font-medium">
          내한 공연이 있는 일본 아티스트 {artists.length}명
        </p>
      </div>

      {artists.length === 0 ? (
        <div className="bg-surface-container-low rounded-3xl py-16 text-center">
          <p className="text-on-surface-variant">등록된 아티스트가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {artists.map((artist, idx) => {
            const hitCount = normalizeSongs(artist.hit_songs).length;
            const gradient = gradients[idx % gradients.length];
            return (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-high mb-3">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name_ko}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
                    >
                      <span className="editorial-title text-5xl font-black italic text-on-primary/60 tracking-tighter">
                        {artist.name_ko[0]}
                      </span>
                    </div>
                  )}
                  {artist.performanceCount > 0 && (
                    <span className="absolute top-2 right-2 bg-on-primary/90 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {artist.performanceCount}공연
                    </span>
                  )}
                </div>
                <h3 className="editorial-title-sm text-base font-black text-on-surface group-hover:text-primary transition-colors truncate">
                  {artist.name_en || artist.name_ko}
                </h3>
                <p className="text-xs text-on-surface-variant truncate">
                  {artist.name_ko}
                  {artist.name_ja && artist.name_ja !== artist.name_en
                    ? ` / ${artist.name_ja}`
                    : ""}
                </p>
                {hitCount > 0 && (
                  <p className="text-[10px] text-on-primary-fixed-variant font-bold mt-1 uppercase tracking-widest">
                    대표곡 {hitCount}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
