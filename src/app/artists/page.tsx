import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

const avatarColors = [
  { bg: "bg-[#d8e2ff]", text: "text-[#0058be]" },
  { bg: "bg-[#dae2fd]", text: "text-[#424754]" },
  { bg: "bg-[#6cf8bb]", text: "text-[#00714d]" },
  { bg: "bg-[#ffd6d6]", text: "text-[#da3437]" },
  { bg: "bg-[#e8d6ff]", text: "text-[#6b4297]" },
  { bg: "bg-[#fff3d6]", text: "text-[#8b6914]" },
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
    <div className="mx-auto max-w-[1280px] px-6 pt-24 pb-36">
      <h2 className="text-[30px] font-black text-[#131b2e] tracking-[-1.5px] leading-[36px] mb-2">
        아티스트
      </h2>
      <p className="text-base text-[#424754] mb-10">
        내한 공연이 있는 일본 아티스트 목록
      </p>

      {artists.length === 0 ? (
        <p className="text-[#424754]">등록된 아티스트가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist, idx) => {
            const color = avatarColors[idx % avatarColors.length];
            return (
              <Link key={artist.id} href={`/artists/${artist.id}`}>
                <div className="bg-white rounded-lg p-5 hover:shadow-md transition-shadow flex items-center gap-5">
                  <div
                    className={`w-16 h-16 rounded-xl ${color.bg} flex items-center justify-center text-2xl font-bold ${color.text} shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] shrink-0`}
                  >
                    {artist.name_ko[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#131b2e]">
                      {artist.name_en || artist.name_ko}
                    </h3>
                    <p className="text-sm font-medium text-[#424754]">
                      {artist.name_ko}
                      {artist.name_ja && artist.name_ja !== artist.name_en
                        ? ` / ${artist.name_ja}`
                        : ""}
                    </p>
                    <p className="text-xs text-[#727785]">
                      공연 {artist.performanceCount}건
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
