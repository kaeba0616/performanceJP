import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { SongList } from "@/components/SongList";
import { createServerClient } from "@/lib/supabase/server";
import { normalizeSongs } from "@/types";

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
    .select("*, artist:artists(*)")
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
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="editorial-title text-3xl font-black text-on-surface">
          아티스트를 찾을 수 없습니다
        </h1>
        <Link
          href="/artists"
          className="text-primary font-bold mt-4 inline-block hover:underline"
        >
          아티스트 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { artist, performances } = data;
  const hitSongs = normalizeSongs(artist.hit_songs);
  const upcoming = performances.filter(
    (p) => p.status !== "completed"
  );
  const past = performances.filter((p) => p.status === "completed");

  return (
    <div className="mx-auto max-w-7xl px-6 pt-8 pb-24">
      <Link
        href="/artists"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary mb-8 transition-colors uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" />
        아티스트 목록
      </Link>

      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-12 mb-16 items-center">
        <div className="relative aspect-square w-full max-w-[240px] md:max-w-none rounded-3xl overflow-hidden bg-surface-container-high mx-auto md:mx-0">
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name_ko}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-primary-fixed-dim flex items-center justify-center">
              <span className="editorial-title text-8xl font-black italic text-on-primary/50 tracking-tighter">
                {artist.name_ko[0]}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">
            J-Pop / J-Rock Artist
          </p>
          <h1 className="editorial-title text-5xl md:text-6xl font-black text-on-surface mb-3 leading-[0.95]">
            {artist.name_en || artist.name_ko}
          </h1>
          <p className="text-lg text-on-surface-variant font-medium mb-6">
            {artist.name_ko}
            {artist.name_ja && artist.name_ja !== artist.name_en
              ? ` · ${artist.name_ja}`
              : ""}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {artist.instagram_url && (
              <a
                href={artist.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center hover:scale-105 transition-transform"
                title="Instagram"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            )}
            {artist.youtube_url && (
              <a
                href={artist.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center hover:scale-105 transition-transform"
                title="YouTube"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            )}
            {artist.x_url && (
              <a
                href={artist.x_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-black flex items-center justify-center hover:scale-105 transition-transform"
                title="X (Twitter)"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {hitSongs.length > 0 && (
              <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                대표곡 {hitSongs.length}곡
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hit Songs */}
      {hitSongs.length > 0 && (
        <div className="mb-16">
          <SongList songs={hitSongs} title="대표곡" />
        </div>
      )}

      {/* Upcoming performances */}
      {upcoming.length > 0 && (
        <section className="mb-16">
          <h2 className="editorial-title text-3xl md:text-4xl font-black text-on-surface mb-8">
            🎤 공연 일정
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {upcoming.map((p) => (
              <PerformanceCard key={p.id} performance={p} />
            ))}
          </div>
        </section>
      )}

      {/* Past performances */}
      {past.length > 0 && (
        <section>
          <h2 className="editorial-title text-3xl md:text-4xl font-black text-on-surface mb-8">
            📼 지난 공연
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {past.map((p) => (
              <PerformanceCard key={p.id} performance={p} />
            ))}
          </div>
        </section>
      )}

      {performances.length === 0 && (
        <div className="bg-surface-container-low rounded-3xl py-16 text-center">
          <p className="text-on-surface-variant">예정된 공연이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
