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
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#131b2e]">아티스트를 찾을 수 없습니다</h1>
        <Link href="/artists" className="text-[#0058be] mt-4 inline-block">
          아티스트 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { artist, performances } = data;

  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-24 pb-36">
      <Link
        href="/artists"
        className="text-sm text-[#424754] hover:text-[#131b2e] mb-6 inline-block"
      >
        &larr; 아티스트 목록
      </Link>

      <div className="flex items-center gap-5 mb-10">
        <div className="w-20 h-20 rounded-xl bg-[#d8e2ff] flex items-center justify-center text-3xl font-bold text-[#0058be] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
          {artist.name_ko[0]}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-[-1px]">
              {artist.name_en || artist.name_ko}
            </h1>
            {/* SNS Links */}
            {artist.instagram_url && (
              <a
                href={artist.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center hover:opacity-80 transition-opacity"
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
                className="w-9 h-9 rounded-lg bg-[#FF0000] flex items-center justify-center hover:opacity-80 transition-opacity"
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
                className="w-9 h-9 rounded-lg bg-[#000000] flex items-center justify-center hover:opacity-80 transition-opacity"
                title="X (Twitter)"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
          </div>
          <p className="text-base text-[#424754] mt-1">
            {artist.name_ko}
            {artist.name_ja && artist.name_ja !== artist.name_en
              ? ` / ${artist.name_ja}`
              : ""}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#131b2e] mb-4">공연 일정</h2>
      {performances.length === 0 ? (
        <p className="text-[#424754]">예정된 공연이 없습니다.</p>
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
